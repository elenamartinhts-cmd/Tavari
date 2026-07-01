"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Pencil } from "lucide-react";
import type { Tenant } from "@/lib/types";

export default function EditTenantDialog({ tenant }: { tenant: Tenant }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    full_name: tenant.full_name,
    email: tenant.email,
    phone: tenant.phone ?? "",
    nationality: tenant.nationality ?? "",
    date_of_birth: tenant.date_of_birth ?? "",
    id_type: (tenant.id_type ?? "") as "dni" | "nie" | "passport" | "",
    id_number: tenant.id_number ?? "",
    employer: tenant.employer ?? "",
    position: tenant.position ?? "",
    emergency_contact_name: tenant.emergency_contact_name ?? "",
    emergency_contact_phone: tenant.emergency_contact_phone ?? "",
    move_in_date: tenant.move_in_date ?? "",
    move_out_date: tenant.move_out_date ?? "",
  });
  const router = useRouter();

  function set(field: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function handleSave() {
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { error: updateError } = await supabase.from("tenants").update({
      full_name: form.full_name,
      email: form.email,
      phone: form.phone || "",
      nationality: form.nationality || null,
      date_of_birth: form.date_of_birth || null,
      id_type: (form.id_type || null) as "dni" | "nie" | "passport" | null,
      id_number: form.id_number || null,
      employer: form.employer || null,
      position: form.position || null,
      emergency_contact_name: form.emergency_contact_name || null,
      emergency_contact_phone: form.emergency_contact_phone || null,
      move_in_date: form.move_in_date || null,
      move_out_date: form.move_out_date || null,
    }).eq("id", tenant.id);
    setLoading(false);
    if (updateError) { setError(updateError.message); return; }
    setOpen(false);
    router.refresh();
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 px-3 py-2 text-sm border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
      >
        <Pencil className="w-4 h-4" />
        Editar
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="px-6 pt-6 pb-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900">Editar inquilino</h3>
            </div>
            <div className="px-6 py-5 space-y-3">
              <Field label="Nombre completo" value={form.full_name} onChange={set("full_name")} required />
              <div className="grid grid-cols-2 gap-3">
                <Field label="Email" type="email" value={form.email} onChange={set("email")} required />
                <Field label="Teléfono" value={form.phone} onChange={set("phone")} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Nacionalidad" value={form.nationality} onChange={set("nationality")} />
                <Field label="Fecha de nacimiento" type="date" value={form.date_of_birth} onChange={set("date_of_birth")} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Tipo documento</label>
                  <select value={form.id_type} onChange={set("id_type")} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-olive-500">
                    <option value="">—</option>
                    <option value="dni">DNI</option>
                    <option value="nie">NIE</option>
                    <option value="passport">Pasaporte</option>
                  </select>
                </div>
                <Field label="Número documento" value={form.id_number} onChange={set("id_number")} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Empresa" value={form.employer} onChange={set("employer")} />
                <Field label="Puesto" value={form.position} onChange={set("position")} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Contacto emergencia" value={form.emergency_contact_name} onChange={set("emergency_contact_name")} />
                <Field label="Tel. emergencia" value={form.emergency_contact_phone} onChange={set("emergency_contact_phone")} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Fecha entrada" type="date" value={form.move_in_date} onChange={set("move_in_date")} />
                <Field label="Fecha salida" type="date" value={form.move_out_date} onChange={set("move_out_date")} />
              </div>

              {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
            </div>
            <div className="px-6 pb-6 flex gap-2">
              <button onClick={() => setOpen(false)} className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50">
                Cancelar
              </button>
              <button onClick={handleSave} disabled={loading} className="flex-1 px-3 py-2 text-sm bg-olive-600 text-white rounded-lg hover:bg-olive-700 disabled:opacity-50">
                {loading ? "Guardando..." : "Guardar cambios"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function Field({ label, value, onChange, type = "text", required }: {
  label: string; value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type?: string; required?: boolean;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-700 mb-1">{label}</label>
      <input
        type={type} value={value} onChange={onChange} required={required}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-olive-500"
      />
    </div>
  );
}
