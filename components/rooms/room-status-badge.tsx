import { cn } from "@/lib/utils";
import type { RoomStatus } from "@/lib/types";

const config: Record<RoomStatus, { label: string; dot: string; text: string; bg: string }> = {
  occupied: { label: "Ocupada", dot: "bg-emerald-500", text: "text-emerald-700", bg: "bg-emerald-50" },
  vacant: { label: "Libre", dot: "bg-gray-300", text: "text-gray-500", bg: "bg-gray-50" },
  reserved: { label: "Reservada", dot: "bg-olive-500", text: "text-olive-700", bg: "bg-olive-50" },
  maintenance: { label: "Mantenimiento", dot: "bg-amber-500", text: "text-amber-700", bg: "bg-amber-50" },
};

export default function RoomStatusBadge({
  status,
  size = "md",
}: {
  status: RoomStatus;
  size?: "sm" | "md";
}) {
  const c = config[status];

  if (size === "sm") {
    return (
      <span
        title={c.label}
        className={cn("inline-block w-3 h-3 rounded-full flex-shrink-0", c.dot)}
      />
    );
  }

  return (
    <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium", c.bg, c.text)}>
      <span className={cn("w-1.5 h-1.5 rounded-full", c.dot)} />
      {c.label}
    </span>
  );
}
