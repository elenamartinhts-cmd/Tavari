import type { PaymentStatus } from "@/lib/types";

const config: Record<PaymentStatus, { label: string; class: string }> = {
  paid: { label: "Pagado", class: "bg-emerald-50 text-emerald-700" },
  pending: { label: "Pendiente", class: "bg-amber-50 text-amber-700" },
  overdue: { label: "Vencido", class: "bg-red-50 text-red-700" },
  partial: { label: "Parcial", class: "bg-olive-50 text-olive-700" },
};

export default function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  const c = config[status];
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${c.class}`}>
      {c.label}
    </span>
  );
}
