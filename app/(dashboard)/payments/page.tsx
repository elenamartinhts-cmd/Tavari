import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { TrendingUp, Clock, AlertCircle, ChevronLeft, ChevronRight, CreditCard } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Payment, Tenant, Room, Property } from "@/lib/types";
import PaymentStatusBadge from "@/components/payments/payment-status-badge";
import MarkPaidDialog from "@/components/payments/mark-paid-dialog";
import MarkOverdueButton from "@/components/payments/mark-overdue-button";
import AddPaymentDialog from "@/components/payments/add-payment-dialog";
import GenerateMonthlyDialog from "@/components/payments/generate-monthly-dialog";
import MonthNav from "@/components/payments/month-nav";

type PaymentRow = Payment & {
  tenants: Tenant & { rooms: (Room & { properties: Property }) | null };
  rooms: Room | null;
};

async function getPayments(landlordId: string, year: number, month: number): Promise<PaymentRow[]> {
  const supabase = await createClient();
  const from = `${year}-${String(month).padStart(2, "0")}-01`;
  // Day 0 of next month = last day of this month — correct for 28/29/30/31-day months
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const to = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

  const { data } = await supabase
    .from("payments")
    .select("*, tenants!inner(*, landlord_id, rooms(*, properties(*))), rooms(*)")
    .eq("tenants.landlord_id", landlordId)
    .gte("due_date", from)
    .lte("due_date", to)
    .order("due_date", { ascending: true });

  return (data ?? []) as PaymentRow[];
}

async function getActiveTenants(landlordId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("tenants")
    .select("id, full_name, room_id, rooms(id, number, monthly_rent, properties(id, name))")
    .eq("landlord_id", landlordId)
    .eq("is_active", true);
  return data ?? [];
}

const MONTH_NAMES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

export default async function PaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; year?: string }>;
}) {
  const sp = await searchParams;
  const now = new Date();
  const year = parseInt(sp.year ?? String(now.getFullYear()));
  const month = parseInt(sp.month ?? String(now.getMonth() + 1));

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const [payments, activeTenants] = await Promise.all([
    getPayments(user.id, year, month),
    getActiveTenants(user.id),
  ]);

  const paid = payments.filter((p) => p.status === "paid");
  const pending = payments.filter((p) => p.status === "pending");
  const overdue = payments.filter((p) => p.status === "overdue");
  const partial = payments.filter((p) => p.status === "partial");

  const totalPaid = paid.reduce((s, p) => s + p.amount, 0);
  const totalPending = pending.reduce((s, p) => s + p.amount, 0);
  const totalOverdue = overdue.reduce((s, p) => s + p.amount, 0);
  const totalExpected = payments.reduce((s, p) => s + p.amount, 0);

  const prevMonth = month === 1 ? 12 : month - 1;
  const prevYear = month === 1 ? year - 1 : year;
  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear = month === 12 ? year + 1 : year;

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pagos</h1>
          <p className="text-gray-500 mt-0.5">
            {MONTH_NAMES[month - 1]} {year}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <GenerateMonthlyDialog
            activeTenants={activeTenants as any}
            year={year}
            month={month}
            existingTenantIds={payments.map((p) => p.tenant_id)}
          />
          <AddPaymentDialog activeTenants={activeTenants as any} year={year} month={month} />
        </div>
      </div>

      {/* Month navigation */}
      <MonthNav
        year={year}
        month={month}
        prevYear={prevYear}
        prevMonth={prevMonth}
        nextYear={nextYear}
        nextMonth={nextMonth}
        monthName={MONTH_NAMES[month - 1]}
      />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          icon={<TrendingUp className="w-5 h-5 text-emerald-600" />}
          bg="bg-emerald-50"
          label="Cobrado"
          value={formatCurrency(totalPaid)}
          sub={`${paid.length} pago${paid.length !== 1 ? "s" : ""}`}
        />
        <StatCard
          icon={<Clock className="w-5 h-5 text-amber-600" />}
          bg="bg-amber-50"
          label="Pendiente"
          value={formatCurrency(totalPending)}
          sub={`${pending.length + partial.length} pago${pending.length + partial.length !== 1 ? "s" : ""}`}
          alert={totalPending > 0}
        />
        <StatCard
          icon={<AlertCircle className="w-5 h-5 text-red-600" />}
          bg="bg-red-50"
          label="Vencido"
          value={formatCurrency(totalOverdue)}
          sub={`${overdue.length} pago${overdue.length !== 1 ? "s" : ""}`}
          alert={totalOverdue > 0}
        />
        <StatCard
          icon={<CreditCard className="w-5 h-5 text-olive-600" />}
          bg="bg-olive-50"
          label="Total esperado"
          value={formatCurrency(totalExpected)}
          sub={`${payments.length} registro${payments.length !== 1 ? "s" : ""}`}
        />
      </div>

      {/* Payments table */}
      {payments.length === 0 ? (
        <EmptyState activeTenants={activeTenants as any} year={year} month={month} />
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Inquilino</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide hidden md:table-cell">Habitación</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Importe</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide hidden lg:table-cell">Vencimiento</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide hidden lg:table-cell">Pagado</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Estado</th>
                <th className="px-6 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {payments.map((payment) => (
                <PaymentRow key={payment.id} payment={payment} />
              ))}
            </tbody>
          </table>

          {/* Progress bar */}
          {totalExpected > 0 && (
            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50">
              <div className="flex items-center justify-between text-xs text-gray-500 mb-1.5">
                <span>Cobrado {Math.round((totalPaid / totalExpected) * 100)}%</span>
                <span>{formatCurrency(totalPaid)} / {formatCurrency(totalExpected)}</span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all"
                  style={{ width: `${Math.min(100, (totalPaid / totalExpected) * 100)}%` }}
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function PaymentRow({ payment }: { payment: PaymentRow }) {
  const tenant = payment.tenants;
  const room = tenant?.rooms;
  const isPending = payment.status === "pending" || payment.status === "partial";
  const isOverdue = payment.status === "overdue";

  return (
    <tr className="hover:bg-gray-50/50 transition-colors">
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-olive-100 flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-semibold text-olive-700">
              {tenant.full_name.charAt(0).toUpperCase()}
            </span>
          </div>
          <Link href={`/tenants/${tenant.id}`} className="font-medium text-gray-900 hover:text-olive-600">
            {tenant.full_name}
          </Link>
        </div>
      </td>
      <td className="px-6 py-4 hidden md:table-cell">
        {room ? (
          <div>
            <p className="text-gray-700">{room.properties?.name}</p>
            <p className="text-xs text-gray-400">Hab. {room.number}</p>
          </div>
        ) : (
          <span className="text-gray-400 text-xs">—</span>
        )}
      </td>
      <td className="px-6 py-4">
        <span className="font-semibold text-gray-900">{formatCurrency(payment.amount)}</span>
      </td>
      <td className="px-6 py-4 hidden lg:table-cell text-gray-600">
        {formatDate(payment.due_date)}
      </td>
      <td className="px-6 py-4 hidden lg:table-cell text-gray-600">
        {payment.paid_date ? formatDate(payment.paid_date) : <span className="text-gray-300">—</span>}
      </td>
      <td className="px-6 py-4">
        <PaymentStatusBadge status={payment.status} />
      </td>
      <td className="px-6 py-4 text-right">
        <div className="flex items-center justify-end gap-2">
          {(isPending || isOverdue) && (
            <MarkPaidDialog payment={payment} tenantName={tenant.full_name} />
          )}
          {isPending && (
            <MarkOverdueButton paymentId={payment.id} />
          )}
        </div>
      </td>
    </tr>
  );
}

function StatCard({
  icon, bg, label, value, sub, alert,
}: {
  icon: React.ReactNode; bg: string; label: string;
  value: string; sub?: string; alert?: boolean;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className={`w-9 h-9 rounded-lg ${bg} flex items-center justify-center mb-3`}>
        {icon}
      </div>
      <p className="text-xs text-gray-500 font-medium">{label}</p>
      <p className={`text-2xl font-bold mt-0.5 ${alert ? "text-red-600" : "text-gray-900"}`}>{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  );
}

function EmptyState({ activeTenants, year, month }: { activeTenants: any[]; year: number; month: number }) {
  return (
    <div className="text-center py-20 bg-white rounded-xl border border-gray-200">
      <div className="w-16 h-16 bg-olive-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
        <CreditCard className="w-8 h-8 text-olive-400" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-1">Sin pagos este mes</h3>
      <p className="text-gray-500 text-sm mb-6">
        Genera los pagos mensuales o añade uno manualmente.
      </p>
      <div className="flex items-center justify-center gap-2">
        <GenerateMonthlyDialog
          activeTenants={activeTenants}
          year={year}
          month={month}
          existingTenantIds={[]}
        />
        <AddPaymentDialog activeTenants={activeTenants} year={year} month={month} />
      </div>
    </div>
  );
}
