"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Plus } from "lucide-react";
import type { PaymentStatus } from "@/lib/types";

type ActiveTenant = {
  id: string;
  full_name: string;
  rooms: { id: string; number: string; monthly_rent: number; properties: { name: string } } | null;
};

export default function AddPaymentDialog({
  activeTenants,
  year,
  month,
}: {
  activeTenants: ActiveTenant[];
  year: number;
  month: number;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    tenant_id: "",
    amount: "",
    due_date: `${year}-${String(month).padStart(2, "0")}-05`,
    paid_date: "",
    status: "pending" as PaymentStatus,
    notes: "",
  });
  const router = useRouter();

  const selectedTenant = activeTenants.find((t) => t.id === form.tenant_id);

  function set(field: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      const value = e.target.value;
      setForm((f) => {
        const updated = { ...f, [field]: value };
        // Pre-fill amount from tenant's rent
        if (field === "tenant_id") {
          const tenant = activeTenants.find((t) => t.id === value);
          if (tenant?.rooms?.monthly_rent) {
            updated.amount = String(tenant.rooms.monthly_rent);
          }
        }
        return updated;
      });
    };
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.tenant_id || !form.amount) return;
    setLoading(true);
    setError(null);
    const supabase = createClient();

    const tenant = activeTenants.find((t) => t.id === form.tenant_id);
    const { error: insertError } = await supabase.from("payments").insert({
      tenant_id: form.tenant_id,
      room_id: tenant?.rooms?.id ?? null,
      amount: parseFloat(form.amount),
      due_date: form.due_date,
      paid_date: form.paid_date || null,
      status: form.status,
      notes: form.notes || null,
    });

    setLoading(false);
    if (insertError) { setError(insertError.message); return; }
    setOpen(false);
    setForm({
      tenant_id: "",
      amount: "",
      due_date: `${year}-${String(month).padStart(2, "0")}-05`,
      paid_date: "",
      status: "pending",
      notes: "",
    });
    router.refresh();
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-4 py-2 bg-olive-600 text-white text-sm font-medium rounded-lg hover:bg-olive-700 transition-colors"
      >
        <Plus className="w-4 h-4" />
        Añadir pago
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="px-6 pt-6 pb-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900">Añadir pago manual</h3>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="px-6 py-5 space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Inquilino *</label>
                  <select
                    value={form.tenant_id}
                    onChange={set("tenant_id")}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-olive-500"
                  >
                    <option value="">Seleccionar inquilino</option>
                    {activeTenants.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.full_name}
                        {t.rooms ? ` · Hab. ${t.rooms.number}` : ""}
                      </option>
                    ))}
                  </select>
                  {selectedTenant?.rooms && (
                    <p className="text-xs text-gray-400 mt-1">
                      {selectedTenant.rooms.properties?.name} · Hab. {selectedTenant.rooms.number}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Importe (€) *</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={form.amount}
                      onChange={set("amount")}
                      required
                      placeholder="500"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-olive-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Estado</label>
                    <select
                      value={form.status}
                      onChange={set("status")}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-olive-500"
                    >
                      <option value="pending">Pendiente</option>
                      <option value="paid">Pagado</option>
                      <option value="overdue">Vencido</option>
                      <option value="partial">Parcial</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Fecha vencimiento</label>
                    <input
                      type="date"
                      value={form.due_date}
                      onChange={set("due_date")}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-olive-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Fecha pago</label>
                    <input
                      type="date"
                      value={form.paid_date}
                      onChange={set("paid_date")}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-olive-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Notas</label>
                  <textarea
                    value={form.notes}
                    onChange={set("notes")}
                    rows={2}
                    placeholder="Opcional..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-olive-500 resize-none"
                  />
                </div>

                {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
              </div>

              <div className="px-6 pb-6 flex gap-2">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading || !form.tenant_id || !form.amount}
                  className="flex-1 px-3 py-2 text-sm bg-olive-600 text-white rounded-lg hover:bg-olive-700 disabled:opacity-40 transition-colors"
                >
                  {loading ? "Guardando..." : "Guardar pago"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
