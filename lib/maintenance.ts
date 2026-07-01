import type { IssueStatus, IssuePriority } from "@/lib/types";

export const MAINTENANCE_CATEGORIES = [
  { value: "plumbing",     label: "Fontanería",        color: "bg-olive-400" },
  { value: "electricity",  label: "Electricidad",      color: "bg-yellow-400" },
  { value: "heating",      label: "Calefacción",       color: "bg-orange-400" },
  { value: "internet",     label: "Internet",          color: "bg-violet-400" },
  { value: "appliances",   label: "Electrodomésticos", color: "bg-gray-400" },
  { value: "locks",        label: "Cerraduras",        color: "bg-slate-400" },
  { value: "cleaning",     label: "Limpieza",          color: "bg-green-400" },
  { value: "pest_control", label: "Plagas",            color: "bg-red-400" },
  { value: "water_leak",   label: "Fuga de agua",      color: "bg-cyan-400" },
  { value: "other",        label: "Otro",              color: "bg-gray-300" },
] as const;

export const MAINTENANCE_CATEGORY_LABELS: Record<string, string> =
  Object.fromEntries(MAINTENANCE_CATEGORIES.map((c) => [c.value, c.label]));

export const MAINTENANCE_CATEGORY_COLORS: Record<string, string> =
  Object.fromEntries(MAINTENANCE_CATEGORIES.map((c) => [c.value, c.color]));

export const MAINTENANCE_CATEGORY_VALUES: Set<string> = new Set(MAINTENANCE_CATEGORIES.map((c) => c.value));

export const ISSUE_STATUS_FLOW: { key: IssueStatus; label: string }[] = [
  { key: "open",           label: "Abierta" },
  { key: "in_progress",    label: "En progreso" },
  { key: "waiting_tenant", label: "Espera inquilino" },
  { key: "resolved",       label: "Resuelta" },
  { key: "closed",         label: "Cerrada" },
];

export const ISSUE_PRIORITIES: { value: IssuePriority; label: string }[] = [
  { value: "urgent", label: "Urgente" },
  { value: "medium", label: "Media" },
  { value: "low",    label: "Baja" },
];
