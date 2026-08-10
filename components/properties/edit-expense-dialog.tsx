"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Pencil, X, Users } from "lucide-react";
import { updatePropertyExpense } from "@/app/actions/property-expenses";
import type { PropertyExpense } from "@/lib/types";

const CATEGORIES = [
  "Electricidad", "Agua", "Gas", "Comunidad de propietarios",
  "Seguro del hogar", "Internet/WiFi", "Limpieza", "IBI", "Mantenimiento", "Otro",
];

const inp = "w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-olive-500";

export default function EditExpenseDialog({ expense }: { expense: PropertyExpense }) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const periodMonthKey = expense.period_month.slice(0, 7);
  const hasShares = (expense.expense_shares ?? []).length > 0;

  const [form, setForm] = useState({
    category: expense.category,
    description: expense.description,
    amount: String(expense.amount),
    period_month: periodMonthKey,
    factura_url: expense.factura_url ?? "",
    notes: expense.notes ?? "",
    split_among_tenants: hasShares,
  });

  function set(field: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  const numAmount = parseFloat(form.amount) || 0;

  function handleSubmit() {
    if (!form.amount || numAmount <= 0) { setError("Introduce un importe válido."); return; }
    setError(null);
    startTransition(async () => {
      const result = await updatePropertyExpense({
        id: expense.id,
        category: form.category,
        description: form.description,
        amount: numAmount,
        period_month: form.period_month,
        factura_url: form.factura_url || undefined,
        notes: form.notes || undefined,
        split_among_tenants: form.split_among_tenants,
      });
      if (result.error) { setError(result.error); return; }
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 transition-colors"
      >
        <Pencil className="w-3 h-3" />
        Editar
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">

            <div className="px-6 pt-6 pb-4 border-b border-gray-100 flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-gray-900">Editar gasto</h3>
                <p className="text-xs text-gray-400 mt-0.5">Editable hasta que se añada a pagos.</p>
              </div>
              <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto">

              <button
                type="button"
                onClick={() => setForm((f) => ({ ...f, split_among_tenants: !f.split_among_tenants }))}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-colors text-left ${
                  form.split_among_tenants
                    ? "border-olive-500 bg-olive-50"
                    : "border-gray-200 bg-white hover:border-gray-300"
                }`}
              >
                <div className={`w-5 h-5 rounded flex items-center justify-center border-2 shrink-0 transition-colors ${
                  form.split_among_tenants ? "bg-olive-600 border-olive-600" : "border-gray-300"
                }`}>
                  {form.split_among_tenants && (
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                <div>
                  <p className={`text-sm font-medium ${form.split_among_tenants ? "text-olive-800" : "text-gray-700"}`}>
                    Repartir entre inquilinos
                  </p>
                  <p className="text-xs text-gray-400">
                    Se divide a partes iguales entre los inquilinos con gastos a parte en el contrato
                  </p>
                </div>
                <Users className={`w-4 h-4 ml-auto shrink-0 ${form.split_among_tenants ? "text-olive-600" : "text-gray-300"}`} />
              </button>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Categoría *</label>
                  <select value={form.category} onChange={set("category")} className={inp}>
                    {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                  </select>
                </div>
                {!expense.is_recurring && (
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Mes *</label>
                    <input type="month" value={form.period_month} onChange={set("period_month")} className={inp} />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Descripción</label>
                <input value={form.description} onChange={set("description")} placeholder="WiFi, caldera, comunidad…" className={inp} />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Importe total (€) *</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.amount}
                  onChange={set("amount")}
                  placeholder="0.00"
                  className={inp}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Enlace a la factura (opcional)</label>
                <input value={form.factura_url} onChange={set("factura_url")} placeholder="Google Drive, Dropbox…" className={inp} />
                <p className="text-xs text-gray-400 mt-1">Los inquilinos podrán ver este enlace en su portal.</p>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Notas internas</label>
                <textarea
                  value={form.notes}
                  onChange={set("notes")}
                  rows={2}
                  placeholder="Notas para ti…"
                  className={`${inp} resize-none`}
                />
              </div>

              {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
            </div>

            <div className="px-6 pb-6 flex gap-2">
              <button onClick={() => setOpen(false)} className="px-4 py-2 text-sm border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50">
                Cancelar
              </button>
              <button
                onClick={handleSubmit}
                disabled={isPending}
                className="flex-1 px-4 py-2 text-sm bg-olive-600 text-white rounded-lg hover:bg-olive-700 disabled:opacity-50 transition-colors font-medium"
              >
                {isPending ? "Guardando…" : "Guardar cambios"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
