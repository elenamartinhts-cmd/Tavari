import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatCurrency } from "@/lib/utils";
import {
  Building2, DoorOpen, TrendingUp, Users,
  CreditCard, Wrench, Percent, ArrowUp, ArrowDown, Minus,
} from "lucide-react";
import { MAINTENANCE_CATEGORY_LABELS } from "@/lib/maintenance";
import RevenueBarChart from "@/components/analytics/revenue-bar-chart";
import OccupancyByProperty from "@/components/analytics/occupancy-by-property";
import PaymentHealthBar from "@/components/analytics/payment-health-bar";
import IssuesBreakdown from "@/components/analytics/issues-breakdown";

// ── Data fetching ──────────────────────────────────────────────────────────────

async function getAnalyticsData(landlordId: string) {
  const supabase = await createClient();
  const admin = createAdminClient();

  const cutoff = new Date();
  cutoff.setMonth(cutoff.getMonth() - 24);
  const cutoffStr = cutoff.toISOString().split("T")[0];

  const [propertiesRes, tenantsRes, paymentsRes, issuesRes, allTimePaidRes, expensesRes] = await Promise.all([
    supabase
      .from("properties")
      .select("id, name, rooms(id, status, monthly_rent, tenants(id, is_active))")
      .eq("landlord_id", landlordId),
    supabase
      .from("tenants")
      .select("id, is_active, move_in_date, move_out_date")
      .eq("landlord_id", landlordId),
    supabase
      .from("payments")
      .select("amount, status, due_date, paid_date, tenants!inner(landlord_id)")
      .eq("tenants.landlord_id", landlordId)
      .gte("due_date", cutoffStr),
    supabase
      .from("maintenance_issues")
      .select("category, status, priority, properties!inner(landlord_id)")
      .eq("properties.landlord_id", landlordId),
    supabase
      .from("payments")
      .select("amount, room_id, tenants!inner(landlord_id)")
      .eq("tenants.landlord_id", landlordId)
      .eq("status", "paid"),
    admin
      .from("property_expenses")
      .select("amount, property_id")
      .eq("landlord_id", landlordId)
      .eq("is_recurring", false),
  ]);

  return {
    properties: propertiesRes.data ?? [],
    tenants: tenantsRes.data ?? [],
    payments: paymentsRes.data ?? [],
    issues: issuesRes.data ?? [],
    allTimePaid: allTimePaidRes.data ?? [],
    expenses: expensesRes.data ?? [],
  };
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function buildRevenueMonths(payments: any[]) {
  const now = new Date();
  const months: { label: string; key: string; paid: number; pending: number }[] = [];

  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = d.toLocaleDateString("es-ES", { month: "short" });

    const monthPayments = payments.filter((p) => {
      const ref = p.paid_date ?? p.due_date;
      return ref?.startsWith(key);
    });

    months.push({
      key,
      label,
      paid: monthPayments.filter((p) => p.status === "paid").reduce((s: number, p: any) => s + p.amount, 0),
      pending: monthPayments.filter((p) => p.status !== "paid").reduce((s: number, p: any) => s + p.amount, 0),
    });
  }
  return months;
}

function currentMonthKey() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}


// ── Page ───────────────────────────────────────────────────────────────────────

export default async function AnalyticsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { properties, tenants, payments, issues, allTimePaid, expenses } = await getAnalyticsData(user.id);

  // Portfolio
  const totalRooms = properties.flatMap((p: any) => p.rooms ?? []);
  const occupiedRooms = totalRooms.filter((r: any) => r.status === "occupied");
  const vacantRooms = totalRooms.filter((r: any) => r.status === "vacant");
  const occupancyRate = totalRooms.length > 0
    ? Math.round((occupiedRooms.length / totalRooms.length) * 100)
    : 0;
  const monthlyPotential = totalRooms.reduce((s: number, r: any) => s + (r.monthly_rent ?? 0), 0);
  const monthlyActual = occupiedRooms.reduce((s: number, r: any) => s + (r.monthly_rent ?? 0), 0);

  // Tenants
  const activeTenants = tenants.filter((t: any) => t.is_active);
  const avgRent = activeTenants.length > 0 ? monthlyActual / activeTenants.length : 0;

  // Payments this month
  const thisMonth = currentMonthKey();
  const thisMonthPayments = payments.filter((p: any) => {
    const ref = p.paid_date ?? p.due_date;
    return ref?.startsWith(thisMonth);
  });
  const thisMonthPaid = thisMonthPayments.filter((p: any) => p.status === "paid");
  const thisMonthPending = thisMonthPayments.filter((p: any) => p.status === "pending");
  const thisMonthOverdue = thisMonthPayments.filter((p: any) => p.status === "overdue");
  const thisMonthPartial = thisMonthPayments.filter((p: any) => p.status === "partial");
  const collectionRate = thisMonthPayments.length > 0
    ? Math.round((thisMonthPaid.length / thisMonthPayments.length) * 100)
    : 0;

  const paidAmount = thisMonthPaid.reduce((s: number, p: any) => s + p.amount, 0);
  const pendingAmount = thisMonthPending.reduce((s: number, p: any) => s + p.amount, 0);
  const overdueAmount = thisMonthOverdue.reduce((s: number, p: any) => s + p.amount, 0);
  const partialAmount = thisMonthPartial.reduce((s: number, p: any) => s + p.amount, 0);

  // Revenue months
  const revenueMonths = buildRevenueMonths(payments);
  const lastMonthKey = revenueMonths[revenueMonths.length - 2]?.key ?? "";
  const lastMonthPaid = payments
    .filter((p: any) => p.status === "paid" && (p.paid_date ?? p.due_date)?.startsWith(lastMonthKey))
    .reduce((s: number, p: any) => s + p.amount, 0);
  const revenueTrend = lastMonthPaid > 0
    ? Math.round(((paidAmount - lastMonthPaid) / lastMonthPaid) * 100)
    : null;

  // Occupancy per property
  const propertyOccupancy = (properties as any[]).map((p) => {
    const rooms = p.rooms ?? [];
    const occ = rooms.filter((r: any) => r.status === "occupied").length;
    const rate = rooms.length > 0 ? Math.round((occ / rooms.length) * 100) : 0;
    return { id: p.id, name: p.name, total: rooms.length, occupied: occ, rate };
  });

  // Issues
  const openIssues = (issues as any[]).filter((i) => i.status === "open" || i.status === "in_progress" || i.status === "waiting_tenant");
  const issuesByCategory = Object.entries(
    openIssues.reduce((acc: Record<string, number>, i) => {
      acc[i.category] = (acc[i.category] ?? 0) + 1;
      return acc;
    }, {})
  )
    .map(([cat, count]) => ({ category: cat, label: MAINTENANCE_CATEGORY_LABELS[cat] ?? cat, count: count as number }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  const urgentIssues = openIssues.filter((i: any) => i.priority === "urgent").length;

  // Rentability: build room → property map, then group paid/expenses by property
  const roomToProperty = new Map<string, string>();
  for (const prop of properties as any[]) {
    for (const room of (prop.rooms ?? [])) roomToProperty.set(room.id, prop.id);
  }

  const propPaidMap = new Map<string, number>();
  const propExpensesMap = new Map<string, number>();

  for (const p of allTimePaid as any[]) {
    const propId = roomToProperty.get(p.room_id);
    if (propId) propPaidMap.set(propId, (propPaidMap.get(propId) ?? 0) + p.amount);
  }
  for (const e of expenses as any[]) {
    propExpensesMap.set(e.property_id, (propExpensesMap.get(e.property_id) ?? 0) + e.amount);
  }

  const totalAllTimePaid = Array.from(propPaidMap.values()).reduce((s, v) => s + v, 0);
  const totalAllTimeExpenses = Array.from(propExpensesMap.values()).reduce((s, v) => s + v, 0);
  const netRentability = totalAllTimePaid - totalAllTimeExpenses;

  const propertyRentability = (properties as any[]).map((p) => ({
    id: p.id,
    name: p.name,
    paid: propPaidMap.get(p.id) ?? 0,
    expenses: propExpensesMap.get(p.id) ?? 0,
    balance: (propPaidMap.get(p.id) ?? 0) - (propExpensesMap.get(p.id) ?? 0),
  }));

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Análisis</h1>
        <p className="text-gray-500 mt-0.5">Visión global de tu cartera</p>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <KpiCard
          icon={<Building2 className="w-5 h-5 text-olive-600" />}
          bg="bg-olive-50"
          label="Propiedades"
          value={String(properties.length)}
          sub={`${totalRooms.length} habitaciones`}
        />
        <KpiCard
          icon={<Percent className="w-5 h-5 text-emerald-600" />}
          bg="bg-emerald-50"
          label="Ocupación"
          value={`${occupancyRate}%`}
          sub={`${occupiedRooms.length} ocupadas · ${vacantRooms.length} libres`}
          trend={occupancyRate >= 80 ? "up" : occupancyRate >= 60 ? "flat" : "down"}
        />
        <KpiCard
          icon={<TrendingUp className="w-5 h-5 text-violet-600" />}
          bg="bg-violet-50"
          label="Ingresos este mes"
          value={formatCurrency(paidAmount)}
          sub={revenueTrend !== null ? `${revenueTrend >= 0 ? "+" : ""}${revenueTrend}% vs mes anterior` : "Sin datos previos"}
          trend={revenueTrend !== null ? (revenueTrend > 0 ? "up" : revenueTrend < 0 ? "down" : "flat") : undefined}
        />
        <KpiCard
          icon={<Users className="w-5 h-5 text-amber-600" />}
          bg="bg-amber-50"
          label="Inquilinos activos"
          value={String(activeTenants.length)}
          sub={`Renta media ${formatCurrency(avgRent)}/mes`}
        />
      </div>

      {/* Revenue chart + payment health */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2">
          <RevenueBarChart months={revenueMonths} />
        </div>
        <div>
          <PaymentHealthBar
            paid={paidAmount}
            pending={pendingAmount}
            overdue={overdueAmount}
            partial={partialAmount}
            collectionRate={collectionRate}
            paidCount={thisMonthPaid.length}
            pendingCount={thisMonthPending.length}
            overdueCount={thisMonthOverdue.length}
          />
        </div>
      </div>

      {/* Occupancy + Issues */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <OccupancyByProperty
          properties={propertyOccupancy}
          potential={monthlyPotential}
          actual={monthlyActual}
        />
        <IssuesBreakdown
          byCategory={issuesByCategory}
          total={openIssues.length}
          urgent={urgentIssues}
        />
      </div>

      {/* Rentability summary */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <KpiCard
          icon={<TrendingUp className="w-5 h-5 text-emerald-600" />}
          bg="bg-emerald-50"
          label="Total cobrado"
          value={formatCurrency(totalAllTimePaid)}
          sub="Histórico acumulado"
        />
        <KpiCard
          icon={<CreditCard className="w-5 h-5 text-red-500" />}
          bg="bg-red-50"
          label="Total gastos"
          value={formatCurrency(totalAllTimeExpenses)}
          sub="Histórico acumulado"
        />
        <KpiCard
          icon={<Percent className="w-5 h-5 text-olive-600" />}
          bg="bg-olive-50"
          label="Rentabilidad neta"
          value={`${netRentability < 0 ? "−" : ""}${formatCurrency(Math.abs(netRentability))}`}
          sub="Cobrado menos gastos"
          trend={netRentability > 0 ? "up" : netRentability < 0 ? "down" : "flat"}
        />
      </div>

      {/* Per-property rentability table */}
      {propertyRentability.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-2.5 flex items-center gap-4 text-xs text-gray-400 font-medium uppercase border-b border-gray-100">
            <p className="flex-1">Propiedad</p>
            <p className="w-28 text-right">Cobrado</p>
            <p className="w-28 text-right">Gastos</p>
            <p className="w-28 text-right">Balance</p>
          </div>
          <div className="divide-y divide-gray-50">
            {propertyRentability.map((p) => (
              <div key={p.id} className="px-5 py-3 flex items-center gap-4">
                <p className="text-sm font-medium text-gray-900 flex-1">{p.name}</p>
                <p className="text-sm text-emerald-600 w-28 text-right">{formatCurrency(p.paid)}</p>
                <p className="text-sm text-red-500 w-28 text-right">{formatCurrency(p.expenses)}</p>
                <p className={`text-sm font-semibold w-28 text-right ${p.balance >= 0 ? "text-emerald-700" : "text-red-600"}`}>
                  {p.balance >= 0 ? "" : "−"}{formatCurrency(Math.abs(p.balance))}
                </p>
              </div>
            ))}
          </div>
          <div className="px-5 py-3 bg-gray-50 flex items-center gap-4 border-t border-gray-100">
            <p className="text-xs font-semibold text-gray-500 uppercase flex-1">Total</p>
            <p className="text-sm font-bold text-emerald-600 w-28 text-right">{formatCurrency(totalAllTimePaid)}</p>
            <p className="text-sm font-bold text-red-500 w-28 text-right">{formatCurrency(totalAllTimeExpenses)}</p>
            <p className={`text-sm font-bold w-28 text-right ${netRentability >= 0 ? "text-emerald-700" : "text-red-600"}`}>
              {netRentability >= 0 ? "" : "−"}{formatCurrency(Math.abs(netRentability))}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function KpiCard({
  icon, bg, label, value, sub, trend,
}: {
  icon: React.ReactNode; bg: string; label: string;
  value: string; sub?: string; trend?: "up" | "down" | "flat";
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-9 h-9 rounded-lg ${bg} flex items-center justify-center`}>{icon}</div>
        {trend === "up" && <ArrowUp className="w-4 h-4 text-emerald-500" />}
        {trend === "down" && <ArrowDown className="w-4 h-4 text-red-500" />}
        {trend === "flat" && <Minus className="w-4 h-4 text-gray-300" />}
      </div>
      <p className="text-xs text-gray-500 font-medium">{label}</p>
      <p className="text-2xl font-bold text-gray-900 mt-0.5">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  );
}
