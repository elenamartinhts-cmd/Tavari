"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Plus } from "lucide-react";
import type { IssuePriority } from "@/lib/types";
import { MAINTENANCE_CATEGORIES } from "@/lib/maintenance";

type PropertyOption = {
  id: string;
  name: string;
  rooms: { id: string; number: string; activeTenantId: string | null }[];
};

export default function AddIssueDialog({ properties }: { properties: PropertyOption[] }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "other",
    priority: "medium" as IssuePriority,
    property_id: "",
    room_id: "",
  });
  const router = useRouter();

  const selectedProperty = properties.find((p) => p.id === form.property_id);

  function set(field: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      const value = e.target.value;
      setForm((f) => {
        const updated = { ...f, [field]: value };
        // Reset room when property changes
        if (field === "property_id") updated.room_id = "";
        return updated;
      });
    };
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim() || !form.property_id) return;
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const selectedRoom = selectedProperty?.rooms.find((r) => r.id === form.room_id);
    const { error: insertError } = await supabase.from("maintenance_issues").insert({
      property_id: form.property_id,
      room_id: form.room_id || null,
      tenant_id: selectedRoom?.activeTenantId ?? null,
      title: form.title,
      description: form.description,
      category: form.category,
      priority: form.priority,
      status: "open",
    });
    setLoading(false);
    if (insertError) { setError(insertError.message); return; }
    setOpen(false);
    setForm({ title: "", description: "", category: "other", priority: "medium", property_id: "", room_id: "" });
    router.refresh();
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-4 py-2 bg-olive-600 text-white text-sm font-medium rounded-lg hover:bg-olive-700 transition-colors"
      >
        <Plus className="w-4 h-4" />
        Nueva incidencia
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="px-6 pt-6 pb-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900">Nueva incidencia</h3>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="px-6 py-5 space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Título *</label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={set("title")}
                    required
                    placeholder="Ej: Grifo con goteo en baño compartido"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-olive-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Descripción</label>
                  <textarea
                    value={form.description}
                    onChange={set("description")}
                    rows={3}
                    placeholder="Describe la incidencia con detalle..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-olive-500 resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Categoría</label>
                    <select
                      value={form.category}
                      onChange={set("category")}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-olive-500"
                    >
                      {MAINTENANCE_CATEGORIES.map(({ value, label }) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Prioridad</label>
                    <select
                      value={form.priority}
                      onChange={set("priority")}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-olive-500"
                    >
                      <option value="low">Baja</option>
                      <option value="medium">Media</option>
                      <option value="urgent">Urgente</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Propiedad *</label>
                  <select
                    value={form.property_id}
                    onChange={set("property_id")}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-olive-500"
                  >
                    <option value="">Seleccionar propiedad</option>
                    {properties.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>

                {selectedProperty && selectedProperty.rooms.length > 0 && (
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Habitación (opcional)</label>
                    <select
                      value={form.room_id}
                      onChange={set("room_id")}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-olive-500"
                    >
                      <option value="">Zona común / sin habitación</option>
                      {selectedProperty.rooms.map((r) => (
                        <option key={r.id} value={r.id}>Habitación {r.number}</option>
                      ))}
                    </select>
                  </div>
                )}

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
                  disabled={loading || !form.title.trim() || !form.property_id}
                  className="flex-1 px-3 py-2 text-sm bg-olive-600 text-white rounded-lg hover:bg-olive-700 disabled:opacity-40 transition-colors"
                >
                  {loading ? "Guardando..." : "Crear incidencia"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
