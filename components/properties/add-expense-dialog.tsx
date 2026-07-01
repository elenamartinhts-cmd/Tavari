"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, X, RefreshCw } from "lucide-react";
import { addPropertyExpense } from "@/app/actions/property-expenses";

const CATEGORIES = [
  "Electricidad",
  "Agua",
  "Gas",
  "Comunidad de propietarios",
  "Seguro del hogar",
  "Internet/WiFi",
  "Limpieza",
  "IBI",
  "Mantenimiento",
  "Otro",
];

const inp = "w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-olive-500";

export default function AddExpenseDialog({
  propertyId,
  activeTenantCount,
}: {
  propertyId: string;
  activeTenantCount: number;
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const today = new Date();
  const defaultMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;

  const [form, setForm] = useState({
    category: "Electricidad",
    description: "",
    amount: "",
    period_month: defaultMonth,
    factura_url: "",
    notes: "",
    is_recurring: false,
  });

  function set(field: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  const numAmount = parseFloat(form.amount) || 0;
  const shareAmount = activeTenantCount > 0 ? Math.round((numAmount / activeTenantCount) * 100) / 100 : 0;

  function close() {
    setOpen(false);
    setError(null);
    setForm({ category: "Electricidad", description: "", amount: "", period_month: defaultMonth, factura_url: "", notes: "", is_recurring: false });
    router.refresh();
  }

  function handleSubmit() {
    if (!form.amount || numAmount <= 0) { setError("Introduce un importe válido."); return; }
    setError(null);
    startTransition(async () => {
      const result = await addPropertyExpense({
        property_id: propertyId,
        category: form.category,
        description: form.description,
        amount: numAmount,
        period_month: form.period_month,
        factura_url: form.factura_url || undefined,
        notes: form.notes || undefined,
        is_recurring: form.is_recurring,
      });
      if (result.error) { setError(result.error); return; }
      close();
    });
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-4 py-2 bg-olive-600 text-white text-sm font-medium rounded-lg hover:bg-olive-700 transition-colors"
      >
        <Plus className="w-4 h-4" />
        Añadir gasto
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">

            <div className="px-6 pt-6 pb-4 border-b border-gray-100 flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-gray-900">Nuevo gasto</h3>
                <p className="text-xs text-gray-400 mt-0.5">Se repartirá entre los inquilinos activos.</p>
              </div>
              <button onClick={close} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto">

              {/* Recurring toggle — prominent at top */}
              <button
                type="button"
                onClick={() => setForm((f) => ({ ...f, is_recurring: !f.is_recurring }))}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-colors text-left ${
                  form.is_recurring
                    ? "border-olive-500 bg-olive-50"
                    : "border-gray-200 bg-white hover:border-gray-300"
                }`}
              >
                <div className={`w-5 h-5 rounded flex items-center justify-center border-2 shrink-0 transition-colors ${
                  form.is_recurring ? "bg-olive-600 border-olive-600" : "border-gray-300"
                }`}>
                  {form.is_recurring && (
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                <div>
                  <p className={`text-sm font-medium ${form.is_recurring ? "text-olive-800" : "text-gray-700"}`}>
                    Gasto recurrente
                  </p>
                  <p className="text-xs text-gray-400">
                    Se guarda como plantilla y puedes aplicarlo cada mes con un clic
                  </p>
                </div>
                <RefreshCw className={`w-4 h-4 ml-auto shrink-0 ${form.is_recurring ? "text-olive-600" : "text-gray-300"}`} />
              </button>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Categoría *</label>
                  <select value={form.category} onChange={set("category")} className={inp}>
                    {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                  </select>
                </div>
                {!form.is_recurring && (
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
                <label className="block text-xs font-medium text-gray-700 mb-1">Importe {form.is_recurring ? "" : "total"} (€) *</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.amount}
                  onChange={set("amount")}
                  placeholder="0.00"
                  className={inp}
                />
                {numAmount > 0 && activeTenantCount > 0 && !form.is_recurring && (
                  <p className="text-xs text-olive-700 mt-1">
                    {activeTenantCount} {activeTenantCount === 1 ? "inquilino activo" : "inquilinos activos"} · {shareAmount.toFixed(2)} € por persona
                  </p>
                )}
                {numAmount > 0 && activeTenantCount > 0 && form.is_recurring && (
                  <p className="text-xs text-olive-700 mt-1">
                    Al aplicar: {shareAmount.toFixed(2)} € por persona entre {activeTenantCount} {activeTenantCount === 1 ? "inquilino" : "inquilinos"}
                  </p>
                )}
                {activeTenantCount === 0 && !form.is_recurring && (
                  <p className="text-xs text-amber-600 mt-1">No hay inquilinos activos — el gasto quedará registrado sin repartir.</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Enlace a la factura (opcional)</label>
                <input
                  value={form.factura_url}
                  onChange={set("factura_url")}
                  placeholder="Google Drive, Dropbox…"
                  className={inp}
                />
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
              <button onClick={close} className="px-4 py-2 text-sm border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50">
                Cancelar
              </button>
              <button
                onClick={handleSubmit}
                disabled={isPending}
                className="flex-1 px-4 py-2 text-sm bg-olive-600 text-white rounded-lg hover:bg-olive-700 disabled:opacity-50 transition-colors font-medium"
              >
                {isPending ? "Guardando…" : form.is_recurring ? "Guardar gasto fijo" : "Guardar gasto"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
