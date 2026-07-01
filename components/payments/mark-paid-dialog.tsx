"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { CheckCircle } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import type { Payment } from "@/lib/types";

export default function MarkPaidDialog({
  payment,
  tenantName,
}: {
  payment: Pick<Payment, "id" | "amount" | "due_date">;
  tenantName: string;
}) {
  const [open, setOpen] = useState(false);
  const [paidDate, setPaidDate] = useState(new Date().toISOString().split("T")[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleConfirm() {
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { error: updateError } = await supabase
      .from("payments")
      .update({ status: "paid", paid_date: paidDate })
      .eq("id", payment.id);
    setLoading(false);
    if (updateError) { setError(updateError.message); return; }
    setOpen(false);
    router.refresh();
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
      >
        <CheckCircle className="w-3.5 h-3.5" />
        Marcar pagado
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-white rounded-xl shadow-xl w-80 p-6">
            <h3 className="font-semibold text-gray-900 mb-1">Confirmar pago</h3>
            <p className="text-sm text-gray-500 mb-4">
              {tenantName} · {formatCurrency(payment.amount)}
            </p>

            <div className="mb-6">
              <label className="block text-xs font-medium text-gray-700 mb-1">Fecha de pago</label>
              <input
                type="date"
                value={paidDate}
                onChange={(e) => setPaidDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-olive-500"
              />
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
                disabled={loading}
                className="flex-1 px-3 py-2 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50"
              >
                {loading ? "Guardando..." : "Confirmar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
