import type { IssueStatus } from "@/lib/types";

const config: Record<IssueStatus, { label: string; class: string }> = {
  open: { label: "Abierta", class: "bg-red-50 text-red-700" },
  in_progress: { label: "En progreso", class: "bg-olive-50 text-olive-700" },
  waiting_tenant: { label: "Espera inquilino", class: "bg-amber-50 text-amber-700" },
  resolved: { label: "Resuelta", class: "bg-emerald-50 text-emerald-700" },
  closed: { label: "Cerrada", class: "bg-gray-100 text-gray-500" },
};

export default function IssueStatusBadge({ status }: { status: IssueStatus }) {
  const c = config[status];
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${c.class}`}>
      {c.label}
    </span>
  );
}
