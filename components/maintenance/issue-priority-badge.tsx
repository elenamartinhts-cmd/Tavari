import type { IssuePriority } from "@/lib/types";
import { AlertTriangle, Minus, ChevronUp } from "lucide-react";

const config: Record<IssuePriority, { label: string; class: string; icon: React.ReactNode }> = {
  urgent: {
    label: "Urgente",
    class: "bg-red-100 text-red-700",
    icon: <AlertTriangle className="w-3 h-3" />,
  },
  medium: {
    label: "Media",
    class: "bg-amber-50 text-amber-700",
    icon: <ChevronUp className="w-3 h-3" />,
  },
  low: {
    label: "Baja",
    class: "bg-gray-100 text-gray-500",
    icon: <Minus className="w-3 h-3" />,
  },
};

export default function IssuePriorityBadge({ priority }: { priority: IssuePriority }) {
  const c = config[priority];
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${c.class}`}>
      {c.icon}
      {c.label}
    </span>
  );
}
