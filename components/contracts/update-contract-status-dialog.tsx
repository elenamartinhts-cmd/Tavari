"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { SlidersHorizontal } from "lucide-react";
import type { Contract, ContractStatus } from "@/lib/types";

const STATUSES: { value: ContractStatus; label: string }[] = [
  { value: "draft", label: "Borrador" },
  { value: "pending_signature", label: "Pendiente de firma" },
  { value: "active", label: "Activo" },
  { value: "terminated", label: "Rescindido" },
];

export default function UpdateContractStatusDialog({ contract }: { contract: Pick<Contract, "id" | "status"> }) {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<ContractStatus>(contract.status);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleSave() {
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { error: updateError } = await supabase.from("contracts").update({ status }).eq("id", contract.id);
    setLoading(false);
    if (updateError) { setError(updateError.message); return; }
    setOpen(false);
    router.refresh();
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
      >
        <SlidersHorizontal className="w-4 h-4" />
        Estado
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-white rounded-xl shadow-xl w-72 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Actualizar estado</h3>
            <div className="space-y-2 mb-6">
              {STATUSES.map(({ value, label }) => (
                <label key={value} className="flex items-center gap-2.5 cursor-pointer">
                  <input type="radio" name="status" value={value} checked={status === value} onChange={() => setStatus(value)} className="text-olive-600" />
                  <span className="text-sm text-gray-700">{label}</span>
                </label>
              ))}
            </div>
            {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg mb-4">{error}</p>}

            <div className="flex gap-2">
              <button onClick={() => setOpen(false)} className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50">Cancelar</button>
              <button onClick={handleSave} disabled={loading} className="flex-1 px-3 py-2 text-sm bg-olive-600 text-white rounded-lg hover:bg-olive-700 disabled:opacity-50">
                {loading ? "Guardando..." : "Guardar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
