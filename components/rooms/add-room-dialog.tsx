"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Plus } from "lucide-react";

function generateJoinCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

export default function AddRoomDialog({ propertyId }: { propertyId: string }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    number: "",
    monthly_rent: "",
    deposit_amount: "",
    size_sqm: "",
    floor: "",
    notes: "",
  });
  const router = useRouter();

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { error: insertError } = await supabase.from("rooms").insert({
      property_id: propertyId,
      number: form.number,
      monthly_rent: parseFloat(form.monthly_rent) || 0,
      deposit_amount: parseFloat(form.deposit_amount) || 0,
      size_sqm: form.size_sqm ? parseFloat(form.size_sqm) : null,
      floor: form.floor ? parseInt(form.floor) : null,
      notes: form.notes || null,
      status: "vacant",
      join_code: generateJoinCode(),
    });
    setLoading(false);
    if (insertError) { setError(insertError.message); return; }
    setOpen(false);
    setForm({ number: "", monthly_rent: "", deposit_amount: "", size_sqm: "", floor: "", notes: "" });
    router.refresh();
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-4 py-2 bg-olive-600 text-white text-sm font-medium rounded-lg hover:bg-olive-700 transition-colors"
      >
        <Plus className="w-4 h-4" />
        Añadir habitación
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Nueva habitación</h3>
            <form onSubmit={handleSubmit} className="space-y-3">
              <Field label="Número / nombre" name="number" value={form.number} onChange={handleChange} required placeholder="Ej: 1, 2A, Ático" />
              <div className="grid grid-cols-2 gap-3">
                <Field label="Renta mensual (€)" name="monthly_rent" value={form.monthly_rent} onChange={handleChange} type="number" placeholder="500" />
                <Field label="Fianza (€)" name="deposit_amount" value={form.deposit_amount} onChange={handleChange} type="number" placeholder="1000" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Tamaño (m²)" name="size_sqm" value={form.size_sqm} onChange={handleChange} type="number" placeholder="12" />
                <Field label="Planta" name="floor" value={form.floor} onChange={handleChange} type="number" placeholder="1" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Notas</label>
                <textarea
                  name="notes"
                  value={form.notes}
                  onChange={handleChange}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-olive-500"
                  placeholder="Opcional..."
                />
              </div>

              {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

              <div className="flex gap-2 pt-1">
                <button type="button" onClick={() => setOpen(false)} className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50">
                  Cancelar
                </button>
                <button type="submit" disabled={loading} className="flex-1 px-3 py-2 text-sm bg-olive-600 text-white rounded-lg hover:bg-olive-700 disabled:opacity-50">
                  {loading ? "Guardando..." : "Crear habitación"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

function Field({ label, name, value, onChange, type = "text", required, placeholder }: {
  label: string; name: string; value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type?: string; required?: boolean; placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-700 mb-1">{label}</label>
      <input
        type={type} name={name} value={value} onChange={onChange}
        required={required} placeholder={placeholder}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-olive-500"
      />
    </div>
  );
}
