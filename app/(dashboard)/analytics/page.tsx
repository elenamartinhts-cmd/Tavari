import { createClient } from "@/lib/supabase/server";
import { formatCurrency } from "@/lib/utils";
import {
  Building2, DoorOpen, TrendingUp, Users,
  CreditCard, Wrench, Percent, ArrowUp, ArrowDown, Minus,
} from "lucide-react";
import RevenueBarChart from "@/components/analytics/revenue-bar-chart";
import OccupancyByProperty from "@/components/analytics/occupancy-by-property";
import PaymentHealthBar from "@/components/analytics/payment-health-bar";
import IssuesBreakdown from "@/components/analytics/issues-breakdown";

// ── Data fetching ──────────────────────────────────────────────────────────────

async function getAnalyticsData(landlordId: string) {
  const supabase = await createClient();

  const [propertiesRes, tenantsRes, paymentsRes, issuesRes] = await Promise.all([
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
      .eq("tenants.landlord_id", landlordId),
    supabase
      .from("maintenance_issues")
      .select("category, status, priority, properties!inner(landlord_id)")
      .eq("properties.landlord_id", landlordId),
  ]);

  return {
    properties: propertiesRes.data ?? [],
    tenants: tenantsRes.data ?? [],
    payments: paymentsRes.data ?? [],
    issues: issuesRes.data ?? [],
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

const CATEGORY_LABELS: Record<string, string> = {
  plumbing: "Fontanería",
  electricity: "Electricidad",
  heating: "Calefacción",
  internet: "Internet",
  appliances: "Electrodomésticos",
  locks: "Cerraduras",
  cleaning: "Limpieza",
  pest_control: "Plagas",
  water_leak: "Fuga de agua",
  other: "Otro",
};

// ── Page ───────────────────────────────────────────────────────────────────────

export default async function AnalyticsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { properties, tenants, payments, issues } = await getAnalyticsData(user.id);

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
    .map(([cat, count]) => ({ category: cat, label: CATEGORY_LABELS[cat] ?? cat, count: count as number }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  const urgentIssues = openIssues.filter((i: any) => i.priority === "urgent").length;

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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
