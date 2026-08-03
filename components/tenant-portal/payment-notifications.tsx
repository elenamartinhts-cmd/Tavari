"use client";

import { useTransition } from "react";
import { AlertCircle, Clock, CalendarClock, CheckCheck } from "lucide-react";
import { markNotificationRead } from "@/app/actions/send-expenses";

type PaymentNotif = {
  id: string;
  type: "payment_upcoming" | "payment_due" | "payment_overdue";
  title: string;
  created_at: string;
  read_at: string | null;
  data: {
    payment_id: string;
    amount: number;
    due_date: string;
    days_late?: number;
    days_until?: number;
  };
};

function formatEur(n: number) {
  return n.toLocaleString("es-ES", { style: "currency", currency: "EUR", minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function formatDate(dateStr: string) {
  return new Date(dateStr + "T12:00:00").toLocaleDateString("es-ES", { day: "numeric", month: "long" });
}

const typeConfig = {
  payment_upcoming: {
    icon: CalendarClock,
    bg: "bg-amber-50 border-amber-200",
    dot: "bg-amber-500",
    iconColor: "text-amber-500",
    label: (d: PaymentNotif["data"]) =>
      `Tu pago de ${formatEur(d.amount)} vence en ${d.days_until} días (${formatDate(d.due_date)})`,
  },
  payment_due: {
    icon: Clock,
    bg: "bg-red-50 border-red-200",
    dot: "bg-red-500",
    iconColor: "text-red-500",
    label: (d: PaymentNotif["data"]) =>
      `Tu pago de ${formatEur(d.amount)} vence hoy`,
  },
  payment_overdue: {
    icon: AlertCircle,
    bg: "bg-red-50 border-red-200",
    dot: "bg-red-600",
    iconColor: "text-red-600",
    label: (d: PaymentNotif["data"]) =>
      `Pago vencido de ${formatEur(d.amount)} · ${d.days_late} ${d.days_late === 1 ? "día" : "días"} de retraso`,
  },
};

function PaymentNotifCard({ notif, tenantId }: { notif: PaymentNotif; tenantId: string }) {
  const [, startTransition] = useTransition();
  const cfg = typeConfig[notif.type] ?? typeConfig.payment_due;
  const Icon = cfg.icon;
  const isUnread = !notif.read_at;

  function handleRead() {
    if (isUnread) {
      startTransition(() => markNotificationRead(tenantId, notif.id));
    }
  }

  return (
    <div
      className={`rounded-xl border px-4 py-3.5 flex items-start gap-3 transition-colors ${
        isUnread ? cfg.bg : "bg-white border-gray-200"
      }`}
      onClick={handleRead}
    >
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
        isUnread ? "bg-white/70" : "bg-gray-50"
      }`}>
        <Icon className={`w-4 h-4 ${isUnread ? cfg.iconColor : "text-gray-400"}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium ${isUnread ? "text-gray-900" : "text-gray-500"}`}>
          {cfg.label(notif.data)}
        </p>
        <p className="text-xs text-gray-400 mt-0.5">
          {new Date(notif.created_at).toLocaleDateString("es-ES", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" })}
        </p>
      </div>
      {isUnread && <span className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${cfg.dot}`} />}
    </div>
  );
}

export default function PaymentNotifications({
  notifications,
  tenantId,
}: {
  notifications: PaymentNotif[];
  tenantId: string;
}) {
  if (notifications.length === 0) return null;

  const unreadCount = notifications.filter((n) => !n.read_at).length;

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
          Avisos de pago
        </h2>
        {unreadCount > 0 && (
          <span className="text-xs font-semibold bg-red-500 text-white rounded-full px-2 py-0.5">
            {unreadCount} nueva{unreadCount > 1 ? "s" : ""}
          </span>
        )}
      </div>
      <div className="space-y-2">
        {notifications.map((n) => (
          <PaymentNotifCard key={n.id} notif={n} tenantId={tenantId} />
        ))}
      </div>
    </div>
  );
}
