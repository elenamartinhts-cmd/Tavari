"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, ChevronRight, ChevronLeft, Send } from "lucide-react";
import { createAndInviteTenant } from "@/app/actions/create-tenant";

type VacantRoom = { id: string; number: string; monthly_rent: number; properties: { id: string; name: string } };

export default function AddTenantDialog({ vacantRooms }: { vacantRooms: VacantRoom[] }) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const [hasEndDate, setHasEndDate] = useState(true);
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    room_id: "",
    move_in_date: "",
    move_out_date: "",
    expenses_included: false,
    payment_day: "5",
  });

  function set(field: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  function nextStep() {
    if (!form.full_name.trim() || !form.email.trim()) {
      setError("El nombre y el email son obligatorios.");
      return;
    }
    setError(null);
    setStep(1);
  }

  function handleSubmit() {
    startTransition(async () => {
      const result = await createAndInviteTenant({
        ...form,
        move_out_date: hasEndDate ? form.move_out_date : "",
        expenses_included: form.expenses_included,
        payment_day: parseInt(form.payment_day, 10) || 5,
      });
      if (result.error) { setError(result.error); return; }
      if (result.warning) setWarning(result.warning);
      setDone(true);
    });
  }

  function close() {
    setOpen(false);
    setStep(0);
    setDone(false);
    setError(null);
    setWarning(null);
    setHasEndDate(true);
    setForm({ full_name: "", email: "", room_id: "", move_in_date: "", move_out_date: "", expenses_included: false, payment_day: "5" });
    router.refresh();
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-4 py-2 bg-olive-600 text-white text-sm font-medium rounded-lg hover:bg-olive-700 transition-colors"
      >
        <Plus className="w-4 h-4" />
        Añadir inquilino
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">

            {/* Header */}
            <div className="px-6 pt-6 pb-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900">Nuevo inquilino</h3>
              <p className="text-xs text-gray-400 mt-0.5">
                El inquilino recibirá un email para completar su perfil.
              </p>
              <div className="flex gap-1 mt-3">
                {["Contacto", "Habitación"].map((s, i) => (
                  <div key={s} className="flex-1">
                    <div className={`h-1 rounded-full transition-colors ${i <= step ? "bg-olive-600" : "bg-gray-200"}`} />
                    <p className={`text-xs mt-1 ${i === step ? "text-olive-600 font-medium" : "text-gray-400"}`}>{s}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Body */}
            <div className="px-6 py-5 space-y-4">
              {done ? (
                <div className="text-center py-4">
                  <Send className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
                  <p className="font-semibold text-gray-900">Inquilino creado</p>
                  <p className="text-sm text-gray-500 mt-1">
                    Se ha enviado un email a <strong>{form.email}</strong> para que complete su perfil.
                  </p>
                  {warning && (
                    <p className="text-sm text-amber-700 bg-amber-50 px-3 py-2 rounded-lg mt-3 text-left">{warning}</p>
                  )}
                </div>
              ) : step === 0 ? (
                <>
                  <Field label="Nombre completo *">
                    <input value={form.full_name} onChange={set("full_name")} placeholder="Carlos García López" className={inp} />
                  </Field>
                  <Field label="Email *">
                    <input type="email" value={form.email} onChange={set("email")} placeholder="carlos@email.com" className={inp} />
                  </Field>
                </>
              ) : (
                <>
                  <Field label="Habitación">
                    <select value={form.room_id} onChange={set("room_id")} className={inp}>
                      <option value="">Sin asignar</option>
                      {vacantRooms.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.properties?.name} · Hab. {r.number} · {r.monthly_rent}€/mes
                        </option>
                      ))}
                    </select>
                    {vacantRooms.length === 0 && (
                      <p className="text-xs text-amber-600 mt-1">No hay habitaciones libres disponibles.</p>
                    )}
                  </Field>
                  <Field label="Fecha de entrada">
                    <input type="date" value={form.move_in_date} onChange={set("move_in_date")} className={inp} />
                  </Field>

                  <Field label="Día de pago mensual">
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="1"
                        max="28"
                        value={form.payment_day}
                        onChange={set("payment_day")}
                        className={`w-20 ${inp}`}
                      />
                      <span className="text-sm text-gray-500">de cada mes</span>
                    </div>
                  </Field>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-medium text-gray-700">Fecha de salida</label>
                      <button
                        type="button"
                        onClick={() => setHasEndDate((v) => !v)}
                        className={`text-xs px-2 py-0.5 rounded-full border transition-colors ${
                          !hasEndDate
                            ? "bg-olive-100 border-olive-300 text-olive-700 font-medium"
                            : "border-gray-200 text-gray-400 hover:border-gray-300"
                        }`}
                      >
                        Sin fecha definida
                      </button>
                    </div>
                    {hasEndDate ? (
                      <input type="date" value={form.move_out_date} onChange={set("move_out_date")} className={inp} />
                    ) : (
                      <div className="px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-400 bg-gray-50">
                        Mes a mes · sin fecha de fin
                      </div>
                    )}
                  </div>

                  {/* Expenses included toggle */}
                  <button
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, expenses_included: !f.expenses_included }))}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-colors text-left ${
                      form.expenses_included
                        ? "border-olive-500 bg-olive-50"
                        : "border-gray-200 bg-white hover:border-gray-300"
                    }`}
                  >
                    <div className={`w-5 h-5 rounded flex items-center justify-center border-2 shrink-0 transition-colors ${
                      form.expenses_included ? "bg-olive-600 border-olive-600" : "border-gray-300"
                    }`}>
                      {form.expenses_included && (
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    <div>
                      <p className={`text-sm font-medium ${form.expenses_included ? "text-olive-800" : "text-gray-700"}`}>
                        Gastos incluidos en el precio
                      </p>
                      <p className="text-xs text-gray-400">
                        No recibirá cargos ni notificaciones de gastos compartidos
                      </p>
                    </div>
                  </button>
                </>
              )}

              {error && (
                <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 pb-6 flex gap-2">
              {done ? (
                <button onClick={close} className="w-full px-4 py-2 text-sm bg-olive-600 text-white rounded-lg hover:bg-olive-700 transition-colors">
                  Listo
                </button>
              ) : (
                <>
                  <button
                    onClick={() => { if (step === 0) close(); else setStep(0); }}
                    className="flex items-center gap-1 px-3 py-2 text-sm border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    {step === 0 ? "Cancelar" : "Atrás"}
                  </button>
                  <div className="flex-1" />
                  {step === 0 ? (
                    <button onClick={nextStep} className="flex items-center gap-1 px-4 py-2 text-sm bg-olive-600 text-white rounded-lg hover:bg-olive-700 transition-colors">
                      Siguiente <ChevronRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <button onClick={handleSubmit} disabled={isPending} className="flex items-center gap-2 px-4 py-2 text-sm bg-olive-600 text-white rounded-lg hover:bg-olive-700 disabled:opacity-50 transition-colors">
                      <Send className="w-4 h-4" />
                      {isPending ? "Creando..." : "Crear y enviar invitación"}
                    </button>
                  )}
                </>
              )}
            </div>

          </div>
        </div>
      )}
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-700 mb-1">{label}</label>
      {children}
    </div>
  );
}

const inp = "w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-olive-500";
