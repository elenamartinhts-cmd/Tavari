import type { ContractStatus } from "@/lib/types";

const config: Record<ContractStatus, { label: string; class: string }> = {
  draft: { label: "Borrador", class: "bg-gray-100 text-gray-500" },
  pending_signature: { label: "Pendiente firma", class: "bg-amber-50 text-amber-700" },
  active: { label: "Activo", class: "bg-emerald-50 text-emerald-700" },
  expiring: { label: "Vence pronto", class: "bg-orange-50 text-orange-700" },
  expired: { label: "Expirado", class: "bg-red-50 text-red-600" },
  terminated: { label: "Rescindido", class: "bg-gray-100 text-gray-500" },
};

export default function ContractStatusBadge({ status }: { status: ContractStatus }) {
  const c = config[status];
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${c.class}`}>
      {c.label}
    </span>
  );
}
