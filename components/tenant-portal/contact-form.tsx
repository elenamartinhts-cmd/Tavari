"use client";

import { useEffect, useRef } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { submitIssue, type SubmitIssueState } from "@/app/portal/actions";
import { Send, CheckCircle2, AlertCircle } from "lucide-react";

const CATEGORIES = [
  { value: "plumbing", label: "Fontanería" },
  { value: "electricity", label: "Electricidad" },
  { value: "heating", label: "Calefacción" },
  { value: "internet", label: "Internet" },
  { value: "appliances", label: "Electrodomésticos" },
  { value: "locks", label: "Cerraduras" },
  { value: "cleaning", label: "Limpieza" },
  { value: "pest_control", label: "Plagas" },
  { value: "water_leak", label: "Fuga de agua" },
  { value: "other", label: "Otro" },
];

export default function ContactForm({
  tenantId,
}: {
  tenantId: string;
  tenantName: string;
}) {
  const boundAction = submitIssue.bind(null, tenantId);
  const [state, formAction] = useFormState<SubmitIssueState, FormData>(
    boundAction,
    { status: "idle" }
  );

  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.status === "success") {
      formRef.current?.reset();
    }
  }, [state]);

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100">
        <h2 className="font-semibold text-gray-900">Reportar incidencia</h2>
        <p className="text-xs text-gray-500 mt-0.5">
          Tu arrendador recibirá el aviso y hará seguimiento desde la plataforma.
        </p>
      </div>

      {state.status === "success" ? (
        <div className="px-5 py-10 text-center">
          <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-7 h-7 text-emerald-500" />
          </div>
          <h3 className="font-semibold text-gray-900 mb-1">Incidencia enviada</h3>
          <p className="text-sm text-gray-500 mb-5">
            Tu arrendador ha recibido el aviso. Puedes ver el estado abajo.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="text-sm text-olive-600 hover:underline font-medium"
          >
            Reportar otra incidencia
          </button>
        </div>
      ) : (
        <form ref={formRef} action={formAction} className="px-5 py-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ¿Qué está pasando? <span className="text-red-500">*</span>
            </label>
            <input
              name="title"
              required
              maxLength={120}
              placeholder="Ej: El grifo del baño pierde agua"
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-olive-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
              <select
                name="category"
                defaultValue="other"
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-olive-500"
              >
                {CATEGORIES.map(({ value, label }) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Urgencia</label>
              <select
                name="priority"
                defaultValue="medium"
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-olive-500"
              >
                <option value="low">Baja — puede esperar</option>
                <option value="medium">Media — necesita atención</option>
                <option value="urgent">Urgente — afecta habitabilidad</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descripción <span className="text-gray-400 font-normal">(opcional)</span>
            </label>
            <textarea
              name="description"
              rows={4}
              placeholder="Describe el problema con detalle: cuándo ocurre, si es continuo, si afecta a otras habitaciones..."
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-olive-500 resize-none"
            />
          </div>

          {state.status === "error" && (
            <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 px-3 py-2.5 rounded-lg border border-red-200">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {state.message}
            </div>
          )}

          <SubmitButton />
        </form>
      )}
    </div>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-olive-600 text-white text-sm font-medium rounded-lg hover:bg-olive-700 disabled:opacity-50 transition-colors"
    >
      <Send className="w-4 h-4" />
      {pending ? "Enviando..." : "Enviar incidencia"}
    </button>
  );
}
