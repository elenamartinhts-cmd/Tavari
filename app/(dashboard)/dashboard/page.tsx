import { createClient } from "@/lib/supabase/server";
import { formatCurrency } from "@/lib/utils";
import {
  Building2,
  DoorOpen,
  TrendingUp,
  Clock,
  Wrench,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";
import Link from "next/link";
import type { DashboardStats, MaintenanceIssue, Tenant } from "@/lib/types";
import Greeting from "@/components/layout/greeting";

async function getDashboardData(landlordId: string) {
  const supabase = await createClient();

  const [propertiesRes, roomsRes, paymentsRes, issuesRes, tenantsRes] = await Promise.all([
    supabase.from("properties").select("id").eq("landlord_id", landlordId),
    supabase.from("rooms").select("id, status, monthly_rent, property_id, properties!inner(landlord_id)").eq("properties.landlord_id", landlordId),
    supabase.from("payments").select("amount, status, due_date, paid_date, tenants!inner(landlord_id)").eq("tenants.landlord_id", landlordId),
    supabase.from("maintenance_issues").select("id, title, priority, status, created_at, properties!inner(landlord_id, name), rooms(number)").eq("properties.landlord_id", landlordId).in("status", ["open", "in_progress"]).order("created_at", { ascending: false }).limit(5),
    supabase.from("tenants").select("id, full_name, room_id, move_in_date, move_out_date, rooms(number, properties(name))").eq("landlord_id", landlordId).eq("is_active", true).order("move_in_date", { ascending: false }).limit(5),
  ]);

  const rooms = roomsRes.data ?? [];
  const payments = paymentsRes.data ?? [];

  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const thisMonthPayments = payments.filter((p: any) =>
    (p.paid_date ?? p.due_date)?.startsWith(currentMonth)
  );

  const stats: DashboardStats = {
    total_properties: propertiesRes.data?.length ?? 0,
    total_rooms: rooms.length,
    occupied_rooms: rooms.filter((r) => r.status === "occupied").length,
    vacant_rooms: rooms.filter((r) => r.status === "vacant").length,
    monthly_income: thisMonthPayments.filter((p: any) => p.status === "paid").reduce((sum: number, p: any) => sum + p.amount, 0),
    pending_income: thisMonthPayments.filter((p: any) => p.status === "pending" || p.status === "overdue").reduce((sum: number, p: any) => sum + p.amount, 0),
    open_issues: issuesRes.data?.length ?? 0,
    urgent_issues: issuesRes.data?.filter((i) => i.priority === "urgent").length ?? 0,
  };

  return { stats, issues: issuesRes.data ?? [], tenants: tenantsRes.data ?? [] };
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { stats, issues, tenants } = await getDashboardData(user.id);

  const rawName = (user.user_metadata?.full_name as string | undefined) ?? user.email?.split("@")[0] ?? "propietario";
  const firstName = rawName.split(" ")[0];

  const occupancyRate = stats.total_rooms > 0
    ? Math.round((stats.occupied_rooms / stats.total_rooms) * 100)
    : 0;

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <Greeting firstName={firstName} />

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          icon={<Building2 className="w-5 h-5 text-olive-600" />}
          bg="bg-olive-50"
          label="Propiedades"
          value={String(stats.total_properties)}
          href="/properties"
        />
        <StatCard
          icon={<DoorOpen className="w-5 h-5 text-emerald-600" />}
          bg="bg-emerald-50"
          label="Habitaciones ocupadas"
          value={`${stats.occupied_rooms}/${stats.total_rooms}`}
          sub={`${occupancyRate}% ocupación`}
          href="/properties"
        />
        <StatCard
          icon={<TrendingUp className="w-5 h-5 text-violet-600" />}
          bg="bg-violet-50"
          label="Cobrado este mes"
          value={formatCurrency(stats.monthly_income)}
          href="/payments"
        />
        <StatCard
          icon={<Clock className="w-5 h-5 text-amber-600" />}
          bg="bg-amber-50"
          label="Pendiente de cobro"
          value={formatCurrency(stats.pending_income)}
          href="/payments"
          alert={stats.pending_income > 0}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Open issues */}
        <section className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <Wrench className="w-4 h-4 text-gray-500" />
              <h2 className="text-sm font-semibold text-gray-900">Incidencias abiertas</h2>
              {stats.urgent_issues > 0 && (
                <span className="inline-flex items-center gap-1 text-xs font-medium text-red-700 bg-red-100 px-2 py-0.5 rounded-full">
                  <AlertTriangle className="w-3 h-3" />
                  {stats.urgent_issues} urgente{stats.urgent_issues > 1 ? "s" : ""}
                </span>
              )}
            </div>
            <Link href="/maintenance" className="text-xs text-olive-600 hover:underline flex items-center gap-0.5">
              Ver todas <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {issues.length === 0 ? (
            <div className="px-6 py-8 text-center">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
              <p className="text-sm text-gray-500">Sin incidencias abiertas</p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-50">
              {issues.map((issue) => (
                <IssueRow key={issue.id} issue={issue as any} />
              ))}
            </ul>
          )}
        </section>

        {/* Recent tenants */}
        <section className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-900">Inquilinos activos</h2>
            <Link href="/tenants" className="text-xs text-olive-600 hover:underline flex items-center gap-0.5">
              Ver todos <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {tenants.length === 0 ? (
            <div className="px-6 py-8 text-center">
              <p className="text-sm text-gray-500">Sin inquilinos activos</p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-50">
              {tenants.map((tenant) => (
                <li key={tenant.id} className="flex items-center justify-between px-6 py-3.5">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-semibold text-gray-600">
                        {tenant.full_name.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{tenant.full_name}</p>
                      <p className="text-xs text-gray-500">
                        {(tenant.rooms as any)?.properties?.name} · Hab. {(tenant.rooms as any)?.number}
                      </p>
                    </div>
                  </div>
                  {tenant.move_in_date && (
                    <span className="text-xs text-gray-400">
                      Desde {new Date(tenant.move_in_date).toLocaleDateString("es-ES", { month: "short", year: "numeric" })}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

function StatCard({
  icon, bg, label, value, sub, href, alert,
}: {
  icon: React.ReactNode;
  bg: string;
  label: string;
  value: string;
  sub?: string;
  href: string;
  alert?: boolean;
}) {
  return (
    <Link href={href} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-sm transition-shadow">
      <div className={`w-9 h-9 rounded-lg ${bg} flex items-center justify-center mb-3`}>
        {icon}
      </div>
      <p className="text-xs text-gray-500 font-medium">{label}</p>
      <p className={`text-2xl font-bold mt-0.5 ${alert ? "text-amber-600" : "text-gray-900"}`}>
        {value}
      </p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </Link>
  );
}

function IssueRow({ issue }: { issue: MaintenanceIssue & { properties: { name: string }; rooms: { number: string } | null } }) {
  const priorityConfig = {
    urgent: { label: "Urgente", class: "text-red-700 bg-red-100" },
    medium: { label: "Media", class: "text-amber-700 bg-amber-100" },
    low: { label: "Baja", class: "text-gray-600 bg-gray-100" },
  };
  const p = priorityConfig[issue.priority as keyof typeof priorityConfig] ?? { label: issue.priority, class: "text-gray-600 bg-gray-100" };

  return (
    <li className="flex items-center justify-between px-6 py-3.5">
      <div className="min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">{issue.title}</p>
        <p className="text-xs text-gray-500">
          {issue.properties?.name}{issue.rooms ? ` · Hab. ${issue.rooms.number}` : ""}
        </p>
      </div>
      <span className={`ml-3 flex-shrink-0 text-xs font-medium px-2 py-0.5 rounded-full ${p.class}`}>
        {p.label}
      </span>
    </li>
  );
}
