"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { BellRing } from "lucide-react";

const inp = "w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-olive-500";

function addOneMonth(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00");
  d.setMonth(d.getMonth() + 1);
  return d.toISOString().split("T")[0];
}

export default function RegisterNoticeDialog({ contractId }: { contractId: string }) {
  const today = new Date().toISOString().split("T")[0];
  const [open, setOpen] = useState(false);
  const [noticeDate, setNoticeDate] = useState(today);
  const [endDate, setEndDate] = useState(() => addOneMonth(today));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  function handleNoticeChange(date: string) {
    setNoticeDate(date);
    if (date) setEndDate(addOneMonth(date));
  }

  function handleOpen() {
    const t = new Date().toISOString().split("T")[0];
    setNoticeDate(t);
    setEndDate(addOneMonth(t));
    setError(null);
    setOpen(true);
  }

  async function handleConfirm() {
    if (!noticeDate || !endDate) { setError("Completa las fechas."); return; }
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { error: updateError } = await supabase
      .from("contracts")
      .update({ notice_given_at: noticeDate, end_date: endDate })
      .eq("id", contractId);
    setLoading(false);
    if (updateError) { setError(updateError.message); return; }
    setOpen(false);
    router.refresh();
  }

  return (
    <>
      <button
        onClick={handleOpen}
        className="flex items-center gap-2 px-4 py-2 bg-white border border-amber-200 text-amber-700 text-sm font-medium rounded-lg hover:bg-amber-50 transition-colors"
      >
        <BellRing className="w-4 h-4" />
        Registrar preaviso
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <h3 className="font-semibold text-gray-900 mb-1">Registrar preaviso</h3>
            <p className="text-sm text-gray-500 mb-5">
              Registra cuándo el inquilino notificó su salida. La fecha de fin se calcula a 1 mes, pero puedes ajustarla.
            </p>

            <div className="space-y-4 mb-5">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Fecha de notificación</label>
                <input
                  type="date"
                  value={noticeDate}
                  onChange={(e) => handleNoticeChange(e.target.value)}
                  className={inp}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Fecha de finalización <span className="text-gray-400 font-normal">(ajustable)</span>
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className={inp}
                />
                <p className="text-xs text-gray-400 mt-1">Calculada automáticamente como notificación + 1 mes.</p>
              </div>
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
                onClick={handleConfirm}
                disabled={loading || !noticeDate || !endDate}
                className="flex-1 px-3 py-2 text-sm bg-amber-500 text-white rounded-lg hover:bg-amber-600 disabled:opacity-50 font-medium"
              >
                {loading ? "Guardando..." : "Guardar preaviso"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
