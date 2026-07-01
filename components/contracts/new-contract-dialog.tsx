"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Plus, FileText } from "lucide-react";
import { applyVariables, type ContractData } from "@/lib/contract-variables";

type TenantOption = {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  id_number: string | null;
  rooms: {
    id: string;
    number: string;
    monthly_rent: number;
    deposit_amount: number;
    properties: { id: string; name: string; address: string; city: string; postal_code: string };
  } | null;
};

type TemplateOption = { id: string; name: string };

export default function NewContractDialog({
  activeTenants,
  templates,
  defaultTenantId,
}: {
  activeTenants: TenantOption[];
  templates: TemplateOption[];
  defaultTenantId?: string;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const defaultTenant = defaultTenantId ? activeTenants.find((t) => t.id === defaultTenantId) : undefined;
  const [form, setForm] = useState({
    tenant_id: defaultTenantId ?? "",
    template_id: "",
    start_date: new Date().toISOString().split("T")[0],
    end_date: "",
    monthly_rent: defaultTenant?.rooms ? String(defaultTenant.rooms.monthly_rent) : "",
    deposit_amount: defaultTenant?.rooms ? String(defaultTenant.rooms.deposit_amount) : "",
    notes: "",
  });
  const [preview, setPreview] = useState<string | null>(null);
  const router = useRouter();

  const selectedTenant = activeTenants.find((t) => t.id === form.tenant_id);

  function set(field: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      const value = e.target.value;
      setForm((f) => {
        const updated = { ...f, [field]: value };
        if (field === "tenant_id") {
          const t = activeTenants.find((t) => t.id === value);
          if (t?.rooms) {
            updated.monthly_rent = String(t.rooms.monthly_rent);
            updated.deposit_amount = String(t.rooms.deposit_amount);
          }
        }
        return updated;
      });
      setPreview(null);
    };
  }

  async function handlePreview() {
    if (!form.template_id || !selectedTenant) return;
    const supabase = createClient();
    const { data } = await supabase.from("contract_templates").select("content").eq("id", form.template_id).single();
    if (!data?.content) return;

    const contractData: ContractData = {
      tenant_name: selectedTenant.full_name,
      tenant_email: selectedTenant.email,
      tenant_phone: selectedTenant.phone ?? "",
      tenant_id_number: selectedTenant.id_number ?? "",
      property_name: selectedTenant.rooms?.properties?.name ?? "",
      property_address: selectedTenant.rooms?.properties?.address ?? "",
      property_city: selectedTenant.rooms?.properties?.city ?? "",
      property_postal_code: selectedTenant.rooms?.properties?.postal_code ?? "",
      room_number: selectedTenant.rooms?.number ?? "",
      monthly_rent: parseFloat(form.monthly_rent) || selectedTenant.rooms?.monthly_rent || 0,
      deposit_amount: parseFloat(form.deposit_amount) || selectedTenant.rooms?.deposit_amount || 0,
      start_date: form.start_date,
      end_date: form.end_date || null,
    };

    setPreview(applyVariables(data.content, contractData));
  }

  async function handleCreate() {
    if (!form.tenant_id || !form.start_date) return;
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setError("No autenticado."); setLoading(false); return; }

    let generatedContent: string | null = preview;

    // Generate if not yet previewed
    if (!generatedContent && form.template_id && selectedTenant) {
      const { data } = await supabase.from("contract_templates").select("content").eq("id", form.template_id).single();
      if (data?.content) {
        const contractData: ContractData = {
          tenant_name: selectedTenant.full_name,
          tenant_email: selectedTenant.email,
          tenant_phone: selectedTenant.phone ?? "",
          tenant_id_number: selectedTenant.id_number ?? "",
          property_name: selectedTenant.rooms?.properties?.name ?? "",
          property_address: selectedTenant.rooms?.properties?.address ?? "",
          property_city: selectedTenant.rooms?.properties?.city ?? "",
          property_postal_code: selectedTenant.rooms?.properties?.postal_code ?? "",
          room_number: selectedTenant.rooms?.number ?? "",
          monthly_rent: parseFloat(form.monthly_rent) || selectedTenant.rooms?.monthly_rent || 0,
          deposit_amount: parseFloat(form.deposit_amount) || selectedTenant.rooms?.deposit_amount || 0,
          start_date: form.start_date,
          end_date: form.end_date || null,
        };
        generatedContent = applyVariables(data.content, contractData);
      }
    }

    const { error: insertError } = await supabase.from("contracts").insert({
      landlord_id: user.id,
      tenant_id: form.tenant_id,
      room_id: selectedTenant?.rooms?.id ?? null,
      property_id: selectedTenant?.rooms?.properties?.id ?? null,
      template_id: form.template_id || null,
      generated_content: generatedContent,
      start_date: form.start_date,
      end_date: form.end_date || null,
      monthly_rent: parseFloat(form.monthly_rent) || selectedTenant?.rooms?.monthly_rent || 0,
      deposit_amount: parseFloat(form.deposit_amount) || selectedTenant?.rooms?.deposit_amount || 0,
      status: "draft",
      notes: form.notes || null,
    });

    setLoading(false);
    if (insertError) { setError(insertError.message); return; }
    setOpen(false);
    resetForm();
    router.refresh();
  }

  function resetForm() {
    setForm({
      tenant_id: defaultTenantId ?? "",
      template_id: "",
      start_date: new Date().toISOString().split("T")[0],
      end_date: "",
      monthly_rent: defaultTenant?.rooms ? String(defaultTenant.rooms.monthly_rent) : "",
      deposit_amount: defaultTenant?.rooms ? String(defaultTenant.rooms.deposit_amount) : "",
      notes: "",
    });
    setPreview(null);
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-4 py-2 bg-olive-600 text-white text-sm font-medium rounded-lg hover:bg-olive-700 transition-colors"
      >
        <Plus className="w-4 h-4" />
        Nuevo contrato
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden">
            <div className="px-6 pt-6 pb-4 border-b border-gray-100 flex-shrink-0">
              <h3 className="font-semibold text-gray-900">Nuevo contrato</h3>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Inquilino *</label>
                {defaultTenantId ? (
                  <div className="px-3 py-2 border border-gray-200 bg-gray-50 rounded-lg text-sm text-gray-700">
                    {defaultTenant?.full_name ?? "—"}
                    {defaultTenant?.rooms && <span className="text-gray-400"> · Hab. {defaultTenant.rooms.number}</span>}
                  </div>
                ) : (
                  <select value={form.tenant_id} onChange={set("tenant_id")} required className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-olive-500">
                    <option value="">Seleccionar inquilino</option>
                    {activeTenants.map((t) => (
                      <option key={t.id} value={t.id}>{t.full_name}{t.rooms ? ` · Hab. ${t.rooms.number}` : ""}</option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Plantilla</label>
                <select value={form.template_id} onChange={set("template_id")} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-olive-500">
                  <option value="">Sin plantilla</option>
                  {templates.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
                {templates.length === 0 && (
                  <p className="text-xs text-amber-600 mt-1">No tienes plantillas. Créalas desde "Plantillas".</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Fecha inicio *</label>
                  <input type="date" value={form.start_date} onChange={set("start_date")} required className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-olive-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Fecha fin</label>
                  <input type="date" value={form.end_date} onChange={set("end_date")} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-olive-500" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Renta mensual (€)</label>
                  <input type="number" step="0.01" value={form.monthly_rent} onChange={set("monthly_rent")} placeholder={selectedTenant?.rooms ? String(selectedTenant.rooms.monthly_rent) : "500"} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-olive-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Fianza (€)</label>
                  <input type="number" step="0.01" value={form.deposit_amount} onChange={set("deposit_amount")} placeholder={selectedTenant?.rooms ? String(selectedTenant.rooms.deposit_amount) : "1000"} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-olive-500" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Notas internas</label>
                <textarea value={form.notes} onChange={set("notes")} rows={2} placeholder="Opcional..." className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-olive-500 resize-none" />
              </div>

              {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

              {/* Preview */}
              {form.template_id && form.tenant_id && (
                <div>
                  <button
                    type="button"
                    onClick={handlePreview}
                    className="flex items-center gap-1.5 text-sm text-olive-600 hover:underline font-medium"
                  >
                    <FileText className="w-4 h-4" />
                    {preview ? "Regenerar vista previa" : "Vista previa del contrato"}
                  </button>
                  {preview && (
                    <pre className="mt-2 p-3 bg-gray-50 border border-gray-200 rounded-lg text-xs font-mono whitespace-pre-wrap max-h-48 overflow-y-auto text-gray-700">
                      {preview}
                    </pre>
                  )}
                </div>
              )}
            </div>

            <div className="px-6 pb-6 flex gap-2 flex-shrink-0">
              <button onClick={() => { setOpen(false); resetForm(); setError(null); }} className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50">
                Cancelar
              </button>
              <button
                onClick={handleCreate}
                disabled={loading || !form.tenant_id || !form.start_date}
                className="flex-1 px-3 py-2 text-sm bg-olive-600 text-white rounded-lg hover:bg-olive-700 disabled:opacity-40 transition-colors"
              >
                {loading ? "Creando..." : "Crear contrato"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
