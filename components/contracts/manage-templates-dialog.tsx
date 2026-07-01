"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { LayoutTemplate, Plus, Pencil, Trash2, X, HelpCircle } from "lucide-react";
import { TEMPLATE_VARIABLES } from "@/lib/contract-variables";
import { formatDate } from "@/lib/utils";

type Template = { id: string; name: string; content?: string; created_at: string; updated_at: string };

export default function ManageTemplatesDialog({ templates }: { templates: Template[] }) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Template | null>(null);
  const [creating, setCreating] = useState(false);
  const [showVars, setShowVars] = useState(false);
  const [form, setForm] = useState({ name: "", content: "" });
  const [loading, setLoading] = useState(false);
  const [localTemplates, setLocalTemplates] = useState(templates);
  const [deleteTarget, setDeleteTarget] = useState<Template | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function loadTemplate(t: Template) {
    const supabase = createClient();
    const { data } = await supabase.from("contract_templates").select("content").eq("id", t.id).single();
    setEditing({ ...t, content: data?.content ?? "" });
    setForm({ name: t.name, content: data?.content ?? "" });
  }

  async function handleSave() {
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const now = new Date().toISOString();

    if (editing) {
      const { error: updateError } = await supabase.from("contract_templates").update({ name: form.name, content: form.content, updated_at: now }).eq("id", editing.id);
      if (updateError) { setError(updateError.message); setLoading(false); return; }
      setLocalTemplates((ts) => ts.map((t) => t.id === editing.id ? { ...t, name: form.name, updated_at: now } : t));
    } else {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setError("No autenticado."); setLoading(false); return; }
      const { data, error: insertError } = await supabase.from("contract_templates").insert({ landlord_id: user.id, name: form.name, content: form.content }).select().single();
      if (insertError) { setError(insertError.message); setLoading(false); return; }
      if (data) setLocalTemplates((ts) => [...ts, data]);
    }

    setLoading(false);
    setEditing(null);
    setCreating(false);
    setForm({ name: "", content: "" });
    router.refresh();
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    setError(null);
    const supabase = createClient();
    const { error: deleteError } = await supabase.from("contract_templates").delete().eq("id", deleteTarget.id);
    if (deleteError) { setError(deleteError.message); setDeleting(false); return; }
    setLocalTemplates((ts) => ts.filter((t) => t.id !== deleteTarget.id));
    setDeleting(false);
    setDeleteTarget(null);
    router.refresh();
  }

  const isEditorOpen = editing !== null || creating;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
      >
        <LayoutTemplate className="w-4 h-4" />
        Plantillas
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100 flex-shrink-0">
              <h3 className="font-semibold text-gray-900">Plantillas de contrato</h3>
              <button onClick={() => { setOpen(false); setEditing(null); setCreating(false); setError(null); }} className="p-1 text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <p className="mx-6 mt-4 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg flex-shrink-0">{error}</p>
            )}

            {!isEditorOpen ? (
              <>
                <div className="flex-1 overflow-y-auto px-6 py-4">
                  {localTemplates.length === 0 ? (
                    <div className="text-center py-8">
                      <LayoutTemplate className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                      <p className="text-sm text-gray-400">Sin plantillas. Crea la primera.</p>
                    </div>
                  ) : (
                    <ul className="space-y-2">
                      {localTemplates.map((t) => (
                        <li key={t.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                          <div>
                            <p className="text-sm font-medium text-gray-900">{t.name}</p>
                            <p className="text-xs text-gray-400">Actualizada {formatDate(t.updated_at)}</p>
                          </div>
                          <div className="flex items-center gap-1">
                            <button onClick={() => loadTemplate(t)} className="p-1.5 text-gray-400 hover:text-olive-600 hover:bg-olive-50 rounded-lg transition-colors">
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button onClick={() => setDeleteTarget(t)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <div className="px-6 pb-6 flex-shrink-0">
                  <button
                    onClick={() => { setCreating(true); setForm({ name: "", content: DEFAULT_TEMPLATE }); }}
                    className="flex items-center gap-2 w-full px-4 py-2.5 bg-olive-600 text-white text-sm font-medium rounded-lg hover:bg-olive-700 justify-center"
                  >
                    <Plus className="w-4 h-4" />
                    Nueva plantilla
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Nombre de la plantilla</label>
                    <input
                      value={form.name}
                      onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                      placeholder="Ej: Contrato estándar habitación"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-olive-500"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-medium text-gray-700">Contenido</label>
                      <button
                        onClick={() => setShowVars((v) => !v)}
                        className="flex items-center gap-1 text-xs text-olive-600 hover:underline"
                      >
                        <HelpCircle className="w-3.5 h-3.5" />
                        Variables disponibles
                      </button>
                    </div>
                    {showVars && (
                      <div className="mb-2 p-3 bg-olive-50 rounded-lg border border-olive-100">
                        <p className="text-xs font-medium text-olive-700 mb-1.5">Copia y pega estas variables en el texto:</p>
                        <div className="grid grid-cols-2 gap-1">
                          {TEMPLATE_VARIABLES.map(({ key, label }) => (
                            <div key={key} className="text-xs">
                              <code className="text-olive-800 font-mono bg-olive-100 px-1 rounded">{key}</code>
                              <span className="text-olive-600 ml-1">{label}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    <textarea
                      value={form.content}
                      onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
                      rows={16}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-olive-500 resize-none"
                      placeholder="Escribe el contrato aquí. Usa las variables entre dobles llaves para datos automáticos."
                    />
                  </div>
                </div>
                <div className="px-6 pb-6 flex gap-2 flex-shrink-0">
                  <button
                    onClick={() => { setEditing(null); setCreating(false); setForm({ name: "", content: "" }); }}
                    className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={loading || !form.name.trim()}
                    className="flex-1 px-3 py-2 text-sm bg-olive-600 text-white rounded-lg hover:bg-olive-700 disabled:opacity-50"
                  >
                    {loading ? "Guardando..." : "Guardar plantilla"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/30">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
            <h3 className="font-semibold text-gray-900 mb-2">¿Eliminar "{deleteTarget.name}"?</h3>
            <p className="text-sm text-gray-500 mb-6">
              Esta acción no se puede deshacer. Los contratos ya generados con esta plantilla no se verán afectados.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setDeleteTarget(null)}
                className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 px-3 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {deleting ? "Eliminando..." : "Eliminar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

const DEFAULT_TEMPLATE = `CONTRATO DE ARRENDAMIENTO DE HABITACIÓN

En {{CIUDAD}}, a {{FECHA_HOY}}

REUNIDOS

De una parte, el ARRENDADOR, propietario de la vivienda sita en {{DIRECCION}}, {{CIUDAD}} ({{CODIGO_POSTAL}}).

De otra parte, el ARRENDATARIO, D./Dña. {{NOMBRE_INQUILINO}}, con documento de identidad {{DNI_INQUILINO}}, con domicilio de contacto en {{EMAIL_INQUILINO}}.

EXPONEN

Que el ARRENDADOR es propietario de la habitación número {{NUMERO_HABITACION}} del inmueble ubicado en {{DIRECCION}}, y tiene la intención de arrendar dicha habitación al ARRENDATARIO.

CLÁUSULAS

PRIMERA. OBJETO DEL CONTRATO
El ARRENDADOR cede en arrendamiento al ARRENDATARIO la habitación número {{NUMERO_HABITACION}} del inmueble sito en {{DIRECCION}}, {{CIUDAD}}.

SEGUNDA. DURACIÓN
El presente contrato tendrá una duración desde el {{FECHA_INICIO}} hasta el {{FECHA_FIN}}.

TERCERA. RENTA
La renta mensual acordada es de {{RENTA_MENSUAL}}, pagadera dentro de los primeros cinco días de cada mes.

CUARTA. FIANZA
A la firma del presente contrato, el ARRENDATARIO entrega en concepto de fianza la cantidad de {{FIANZA}}.

QUINTA. USO DE ZONAS COMUNES
El ARRENDATARIO tendrá derecho al uso compartido de las zonas comunes del inmueble (cocina, salón, baños comunes) con los demás ocupantes, debiendo mantenerlas en correcto estado de limpieza y orden.

SEXTA. OBLIGACIONES DEL ARRENDATARIO
El ARRENDATARIO se obliga a:
- Abonar puntualmente la renta mensual.
- No subarrendar la habitación.
- Respetar las normas de convivencia del inmueble.
- Mantener la habitación en buen estado de conservación.

SÉPTIMA. RESOLUCIÓN
El contrato podrá resolverse por mutuo acuerdo o por incumplimiento de cualquiera de las partes, previo aviso con 30 días de antelación.

Y en prueba de conformidad con todo lo expuesto, firman el presente contrato en el lugar y fecha indicados.

ARRENDADOR                          ARRENDATARIO
_______________________             _______________________
                                    {{NOMBRE_INQUILINO}}
`;
