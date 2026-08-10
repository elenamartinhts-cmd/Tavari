"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { DoorOpen } from "lucide-react";
import { updateTenantAssignment } from "@/app/actions/update-tenant-assignment";

type Room = {
  id: string;
  number: string;
  monthly_rent: number;
  properties: { name: string } | null;
};

export default function ChangeRoomDialog({
  tenantId,
  currentRoomId,
  currentRoomNumber,
}: {
  tenantId: string;
  currentRoomId: string | null;
  currentRoomNumber?: string;
}) {
  const [open, setOpen] = useState(false);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (!open) return;
    const supabase = createClient();
    supabase
      .from("rooms")
      .select("id, number, monthly_rent, properties(name)")
      .eq("status", "vacant")
      .order("number")
      .then(({ data }) => setRooms((data as any) ?? []));
  }, [open]);

  async function handleConfirm() {
    if (!selectedRoomId) return;
    setLoading(true);
    setError(null);
    const newRoomRent = selected?.monthly_rent ?? null;
    const result = await updateTenantAssignment({
      tenantId,
      oldRoomId: currentRoomId,
      newRoomId: selectedRoomId,
      newMonthlyRent: newRoomRent && newRoomRent > 0 ? newRoomRent : null,
    });
    setLoading(false);
    if (result.error) { setError(result.error); return; }
    setOpen(false);
    router.refresh();
  }

  const selected = rooms.find((r) => r.id === selectedRoomId);

  return (
    <>
      <button
        onClick={() => { setOpen(true); setSelectedRoomId(""); setError(null); }}
        className="mt-3 w-full flex items-center justify-center gap-1.5 px-3 py-2 text-sm border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
      >
        <DoorOpen className="w-4 h-4" />
        Cambiar habitación
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
            <div className="px-6 pt-6 pb-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900">Cambiar habitación del inquilino</h3>
              {currentRoomNumber && (
                <p className="text-xs text-gray-400 mt-0.5">Habitación actual: {currentRoomNumber}</p>
              )}
            </div>

            <div className="px-6 py-5">
              {rooms.length === 0 ? (
                <p className="text-sm text-gray-400 italic py-2 text-center">No hay habitaciones vacías disponibles.</p>
              ) : (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-gray-500 mb-3">Habitaciones disponibles:</p>
                  {rooms.map((room) => (
                    <button
                      key={room.id}
                      onClick={() => setSelectedRoomId(room.id)}
                      className={`w-full text-left px-4 py-3 rounded-xl border-2 transition-colors ${
                        selectedRoomId === room.id
                          ? "border-olive-500 bg-olive-50"
                          : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      <p className="text-sm font-semibold text-gray-900">
                        Habitación {room.number}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {room.properties?.name ?? "—"} · {room.monthly_rent.toLocaleString("es-ES", { style: "currency", currency: "EUR" })}/mes
                      </p>
                    </button>
                  ))}
                </div>
              )}

              {error && (
                <p className="mt-3 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
              )}
            </div>

            <div className="px-6 pb-6 flex gap-2">
              <button
                onClick={() => setOpen(false)}
                className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirm}
                disabled={!selectedRoomId || loading}
                className="flex-1 px-3 py-2 text-sm bg-olive-600 text-white rounded-lg hover:bg-olive-700 disabled:opacity-40 transition-colors"
              >
                {loading ? "Cambiando..." : selected ? `Asignar Hab. ${selected.number}` : "Confirmar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
