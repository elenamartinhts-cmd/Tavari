"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Zap } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

type ActiveTenant = {
  id: string;
  full_name: string;
  room_id: string | null;
  rooms: { id: string; number: string; monthly_rent: number; properties: { name: string } } | null;
};

const MONTH_NAMES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

export default function GenerateMonthlyDialog({
  activeTenants,
  year,
  month,
  existingTenantIds,
}: {
  activeTenants: ActiveTenant[];
  year: number;
  month: number;
  existingTenantIds: string[];
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dueDay, setDueDay] = useState("5");
  const router = useRouter();

  // Only tenants with a room who don't already have a payment this month
  const eligible = activeTenants.filter(
    (t) => t.rooms && !existingTenantIds.includes(t.id)
  );

  const totalAmount = eligible.reduce((s, t) => s + (t.rooms?.monthly_rent ?? 0), 0);

  async function handleGenerate() {
    if (eligible.length === 0) return;
    setLoading(true);
    setError(null);
    const supabase = createClient();

    const dueDate = `${year}-${String(month).padStart(2, "0")}-${String(dueDay).padStart(2, "0")}`;

    const inserts = eligible.map((t) => ({
      tenant_id: t.id,
      room_id: t.rooms!.id,
      amount: t.rooms!.monthly_rent,
      due_date: dueDate,
      status: "pending" as const,
    }));

    const { error: insertError } = await supabase.from("payments").insert(inserts);
    setLoading(false);
    if (insertError) { setError(insertError.message); return; }
    setOpen(false);
    router.refresh();
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
      >
        <Zap className="w-4 h-4 text-amber-500" />
        Generar mensualidades
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="px-6 pt-6 pb-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900">Generar mensualidades</h3>
              <p className="text-sm text-gray-500 mt-0.5">
                {MONTH_NAMES[month - 1]} {year}
              </p>
            </div>

            <div className="px-6 py-5">
              {eligible.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-sm text-gray-500">
                    Todos los inquilinos activos ya tienen pagos registrados este mes.
                  </p>
                </div>
              ) : (
                <>
                  <div className="mb-4">
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Día de vencimiento
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="1"
                        max="28"
                        value={dueDay}
                        onChange={(e) => setDueDay(e.target.value)}
                        className="w-20 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-olive-500"
                      />
                      <span className="text-sm text-gray-500">de cada mes</span>
                    </div>
                  </div>

                  <div className="rounded-xl border border-gray-100 overflow-hidden mb-4">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-100">
                          <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-400">Inquilino</th>
                          <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-400">Hab.</th>
                          <th className="text-right px-4 py-2.5 text-xs font-semibold text-gray-400">Renta</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {eligible.map((t) => (
                          <tr key={t.id}>
                            <td className="px-4 py-2.5 text-gray-800 font-medium">{t.full_name}</td>
                            <td className="px-4 py-2.5 text-gray-500">
                              {t.rooms?.properties?.name} · {t.rooms?.number}
                            </td>
                            <td className="px-4 py-2.5 text-right text-gray-900 font-semibold">
                              {formatCurrency(t.rooms?.monthly_rent ?? 0)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="bg-gray-50 border-t border-gray-100">
                          <td colSpan={2} className="px-4 py-2.5 text-sm font-semibold text-gray-600">
                            Total · {eligible.length} pagos
                          </td>
                          <td className="px-4 py-2.5 text-right font-bold text-gray-900">
                            {formatCurrency(totalAmount)}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </>
              )}

              {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg mt-4">{error}</p>}
            </div>

            <div className="px-6 pb-6 flex gap-2">
              <button
                onClick={() => setOpen(false)}
                className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50"
              >
                Cancelar
              </button>
              {eligible.length > 0 && (
                <button
                  onClick={handleGenerate}
                  disabled={loading}
                  className="flex-1 px-3 py-2 text-sm bg-olive-600 text-white rounded-lg hover:bg-olive-700 disabled:opacity-50"
                >
                  {loading ? "Generando..." : `Generar ${eligible.length} pago${eligible.length !== 1 ? "s" : ""}`}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
