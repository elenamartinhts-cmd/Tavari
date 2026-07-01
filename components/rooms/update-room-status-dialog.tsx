"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Room, RoomStatus } from "@/lib/types";

const statuses: { value: RoomStatus; label: string }[] = [
  { value: "vacant", label: "Libre" },
  { value: "occupied", label: "Ocupada" },
  { value: "reserved", label: "Reservada" },
  { value: "maintenance", label: "Mantenimiento" },
];

export default function UpdateRoomStatusDialog({ room }: { room: Room }) {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<RoomStatus>(room.status);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleSave() {
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { error: updateError } = await supabase.from("rooms").update({ status }).eq("id", room.id);
    setLoading(false);
    if (updateError) { setError(updateError.message); return; }
    setOpen(false);
    router.refresh();
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="text-xs text-olive-600 hover:underline font-medium"
      >
        Cambiar estado
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="bg-white rounded-xl shadow-xl w-80 p-6">
        <h3 className="font-semibold text-gray-900 mb-1">Habitación {room.number}</h3>
        <p className="text-sm text-gray-500 mb-4">Actualizar estado</p>

        <div className="space-y-2 mb-6">
          {statuses.map(({ value, label }) => (
            <label key={value} className="flex items-center gap-3 cursor-pointer">
              <input
                type="radio"
                name="status"
                value={value}
                checked={status === value}
                onChange={() => setStatus(value)}
                className="text-olive-600"
              />
              <span className="text-sm text-gray-700">{label}</span>
            </label>
          ))}
        </div>

        {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg mb-4">{error}</p>}

        <div className="flex gap-2">
          <button
            onClick={() => setOpen(false)}
            className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="flex-1 px-3 py-2 text-sm bg-olive-600 text-white rounded-lg hover:bg-olive-700 disabled:opacity-50"
          >
            {loading ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </div>
    </div>
  );
}
