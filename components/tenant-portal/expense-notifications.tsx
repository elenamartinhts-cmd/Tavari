"use client";

import { useState, useTransition } from "react";
import { Bell, ChevronDown, ChevronUp, ExternalLink, Receipt, CheckCircle } from "lucide-react";
import { markNotificationRead } from "@/app/actions/send-expenses";

type NotifItem = { label: string; amount: number; factura_url: string | null };

type Notification = {
  id: string;
  title: string;
  created_at: string;
  read_at: string | null;
  data: {
    period_month: string;
    property_name: string;
    items: NotifItem[];
    total: number;
  };
};

function formatEur(n: number) {
  return n.toLocaleString("es-ES", { style: "currency", currency: "EUR" });
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("es-ES", { day: "numeric", month: "long" });
}

function NotificationCard({ notif, tenantId }: { notif: Notification; tenantId: string }) {
  const [open, setOpen] = useState(!notif.read_at);
  const [, startTransition] = useTransition();

  function toggle() {
    const newOpen = !open;
    setOpen(newOpen);
    if (newOpen && !notif.read_at) {
      startTransition(() => markNotificationRead(tenantId, notif.id));
    }
  }

  const isUnread = !notif.read_at;

  return (
    <div className={`rounded-xl border overflow-hidden transition-colors ${isUnread ? "border-olive-200 bg-olive-50" : "border-gray-200 bg-white"}`}>
      <button
        onClick={toggle}
        className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-black/[0.02] transition-colors"
      >
        {isUnread && (
          <span className="w-2 h-2 rounded-full bg-olive-500 shrink-0" />
        )}
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-semibold truncate ${isUnread ? "text-olive-900" : "text-gray-700"}`}>
            {notif.title}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">{formatDate(notif.created_at)}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className={`text-sm font-bold ${isUnread ? "text-olive-800" : "text-gray-700"}`}>
            {formatEur(notif.data.total)}
          </span>
          {open
            ? <ChevronUp className="w-4 h-4 text-gray-400" />
            : <ChevronDown className="w-4 h-4 text-gray-400" />
          }
        </div>
      </button>

      {open && (
        <div className="px-4 pb-4 border-t border-gray-100">
          <div className="space-y-2 mt-3">
            {notif.data.items.map((item, i) => (
              <div key={i} className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm text-gray-700">{item.label}</p>
                  {item.factura_url && (
                    <a
                      href={item.factura_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs text-olive-600 hover:text-olive-800 mt-0.5"
                    >
                      <Receipt className="w-3 h-3" />
                      Ver factura
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
                <span className="text-sm font-semibold text-gray-900 shrink-0">{formatEur(item.amount)}</span>
              </div>
            ))}
          </div>

          <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
            <span className="text-sm font-semibold text-gray-900">Total</span>
            <span className="text-base font-bold text-olive-700">{formatEur(notif.data.total)}</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ExpenseNotifications({ notifications, tenantId }: { notifications: Notification[]; tenantId: string }) {
  const unreadCount = notifications.filter((n) => !n.read_at).length;

  if (notifications.length === 0) return null;

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
          Notificaciones
        </h2>
        {unreadCount > 0 && (
          <span className="text-xs font-semibold bg-olive-600 text-white rounded-full px-2 py-0.5">
            {unreadCount} nueva{unreadCount > 1 ? "s" : ""}
          </span>
        )}
      </div>
      <div className="space-y-2">
        {notifications.map((n) => (
          <NotificationCard key={n.id} notif={n} tenantId={tenantId} />
        ))}
      </div>
    </div>
  );
}
