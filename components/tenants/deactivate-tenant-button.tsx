"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { UserMinus } from "lucide-react";

function defaultEndDate() {
  const d = new Date();
  d.setDate(d.getDate() + 30);
  return d.toISOString().split("T")[0];
}

export default function DeactivateTenantButton({
  tenantId,
  tenantName,
}: {
  tenantId: string;
  tenantName: string;
}) {
  const [open, setOpen] = useState(false);
  const [endDate, setEndDate] = useState(defaultEndDate);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  function handleOpen() {
    setEndDate(defaultEndDate());
    setError(null);
    setOpen(true);
  }

  async function handleDeactivate() {
    if (!endDate) { setError("Selecciona la fecha de fin del contrato."); return; }
    setLoading(true);
    setError(null);
    const supabase = createClient();

    // Fetch room_id before deactivating
    const { data: tenant, error: fetchError } = await supabase
      .from("tenants")
      .select("room_id")
      .eq("id", tenantId)
      .single();

    if (fetchError) { setError(fetchError.message); setLoading(false); return; }

    const { error: updateError } = await supabase
      .from("tenants")
      .update({ is_active: false, room_id: null })
      .eq("id", tenantId);
    if (updateError) { setError(updateError.message); setLoading(false); return; }

    if (tenant?.room_id) {
      const { error: roomError } = await supabase
        .from("rooms")
        .update({ status: "vacant" })
        .eq("id", tenant.room_id);
      if (roomError) console.error("Room status update error:", roomError.message);
    }

    // Terminate the active contract with the chosen end date
    await supabase
      .from("contracts")
      .update({ status: "terminated", end_date: endDate })
      .eq("tenant_id", tenantId)
      .in("status", ["active", "pending_signature", "draft"]);

    setLoading(false);
    setOpen(false);
    router.push("/tenants");
    router.refresh();
  }

  return (
    <>
      <button
        onClick={handleOpen}
        className="flex items-center gap-1.5 px-3 py-2 text-sm border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
      >
        <UserMinus className="w-4 h-4" />
        Dar de baja
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
            <h3 className="font-semibold text-gray-900 mb-1">Dar de baja a {tenantName}</h3>
            <p className="text-sm text-gray-500 mb-5">
              Se liberará la habitación y se finalizará el contrato activo. El historial se conserva.
            </p>

            <div className="mb-5">
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Fecha de fin del contrato
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
              />
              <p className="text-xs text-gray-400 mt-1">Pre-rellenado con 30 días de preaviso.</p>
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
                onClick={handleDeactivate}
                disabled={loading || !endDate}
                className="flex-1 px-3 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {loading ? "Procesando..." : "Dar de baja"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
