"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { completeTenantSetup, type TenantSetupData } from "@/app/actions/tenant-setup";
import { CheckCircle2, ChevronRight, ChevronLeft } from "lucide-react";

const STEPS = [
  "Contraseña",
  "Datos personales",
  "Documento",
  "Empleo",
  "Emergencias",
];

const EMPTY: TenantSetupData = {
  password: "",
  full_name: "",
  phone: "",
  date_of_birth: "",
  nationality: "",
  current_address: "",
  id_type: "",
  id_number: "",
  id_expiry_date: "",
  employer: "",
  position: "",
  monthly_income: "",
  emergency_contact_name: "",
  emergency_contact_phone: "",
  emergency_contact_relationship: "",
  guarantor_name: "",
  guarantor_phone: "",
  guarantor_id_number: "",
};

export default function TenantSetupPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [data, setData] = useState<TenantSetupData>(EMPTY);
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [isPending, startTransition] = useTransition();

  function set(field: keyof TenantSetupData, value: string) {
    setData((prev) => ({ ...prev, [field]: value }));
  }

  function validateStep(): string | null {
    if (step === 0) {
      if (data.password.length < 8) return "La contraseña debe tener al menos 8 caracteres.";
      if (data.password !== confirmPassword) return "Las contraseñas no coinciden.";
    }
    if (step === 1) {
      if (!data.full_name.trim()) return "El nombre completo es obligatorio.";
      if (!data.phone.trim()) return "El teléfono es obligatorio.";
      if (!data.date_of_birth) return "La fecha de nacimiento es obligatoria.";
      if (!data.nationality.trim()) return "La nacionalidad es obligatoria.";
      if (!data.current_address.trim()) return "El domicilio actual es obligatorio.";
    }
    if (step === 2) {
      if (!data.id_type) return "Selecciona el tipo de documento.";
      if (!data.id_number.trim()) return "El número de documento es obligatorio.";
      if (!data.id_expiry_date) return "La fecha de caducidad es obligatoria.";
    }
    if (step === 4) {
      if (!data.emergency_contact_name.trim()) return "El nombre del contacto de emergencia es obligatorio.";
      if (!data.emergency_contact_phone.trim()) return "El teléfono de emergencia es obligatorio.";
      if (!data.emergency_contact_relationship.trim()) return "La relación con el contacto es obligatoria.";
    }
    return null;
  }

  function next() {
    const err = validateStep();
    if (err) { setError(err); return; }
    setError(null);
    if (step < STEPS.length - 1) setStep(step + 1);
    else submit();
  }

  function submit() {
    startTransition(async () => {
      const result = await completeTenantSetup(data);
      if (result.error) { setError(result.error); return; }
      setDone(true);
      setTimeout(() => router.push(`/portal/${result.tenantId}`), 1500);
    });
  }

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-cream to-olive-50">
        <div className="bg-white rounded-2xl shadow-lg p-10 text-center max-w-sm w-full">
          <CheckCircle2 className="w-14 h-14 text-emerald-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-1">¡Todo listo!</h2>
          <p className="text-gray-500 text-sm">Accediendo a tu portal...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-cream to-olive-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-lg p-8">
        {/* Header */}
        <div className="mb-6">
          <span className="text-lg font-bold text-olive-700 tracking-tight">Tavari</span>
          <h1 className="text-xl font-bold text-gray-900 mt-3">Configura tu cuenta</h1>
          <p className="text-sm text-gray-500 mt-0.5">Paso {step + 1} de {STEPS.length}</p>
        </div>

        {/* Progress */}
        <div className="flex gap-1 mb-8">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full transition-colors ${
                i <= step ? "bg-olive-600" : "bg-gray-200"
              }`}
            />
          ))}
        </div>

        {/* Step label */}
        <h2 className="text-base font-semibold text-gray-800 mb-5">{STEPS[step]}</h2>

        {/* Fields */}
        <div className="space-y-4">
          {step === 0 && (
            <>
              <p className="text-sm text-gray-500 -mt-2 mb-4">
                Elige una contraseña para acceder a tu portal en el futuro.
              </p>
              <Field label="Nueva contraseña">
                <input type="password" value={data.password} onChange={(e) => set("password", e.target.value)} placeholder="Mínimo 8 caracteres" className={input} />
              </Field>
              <Field label="Confirmar contraseña">
                <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Repite la contraseña" className={input} />
              </Field>
            </>
          )}

          {step === 1 && (
            <>
              <Field label="Nombre completo *">
                <input value={data.full_name} onChange={(e) => set("full_name", e.target.value)} placeholder="Nombre y apellidos" className={input} />
              </Field>
              <Field label="Teléfono *">
                <input value={data.phone} onChange={(e) => set("phone", e.target.value)} placeholder="+34 612 345 678" className={input} />
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Fecha de nacimiento *">
                  <input type="date" value={data.date_of_birth} onChange={(e) => set("date_of_birth", e.target.value)} className={input} />
                </Field>
                <Field label="Nacionalidad *">
                  <input value={data.nationality} onChange={(e) => set("nationality", e.target.value)} placeholder="Española" className={input} />
                </Field>
              </div>
              <Field label="Domicilio actual (antes de la mudanza) *">
                <input value={data.current_address} onChange={(e) => set("current_address", e.target.value)} placeholder="Calle, número, ciudad" className={input} />
              </Field>
            </>
          )}

          {step === 2 && (
            <>
              <Field label="Tipo de documento *">
                <select value={data.id_type} onChange={(e) => set("id_type", e.target.value)} className={input}>
                  <option value="">Seleccionar...</option>
                  <option value="dni">DNI</option>
                  <option value="nie">NIE</option>
                  <option value="passport">Pasaporte</option>
                </select>
              </Field>
              <Field label="Número de documento *">
                <input value={data.id_number} onChange={(e) => set("id_number", e.target.value)} placeholder="12345678A" className={input} />
              </Field>
              <Field label="Fecha de caducidad *">
                <input type="date" value={data.id_expiry_date} onChange={(e) => set("id_expiry_date", e.target.value)} className={input} />
              </Field>
            </>
          )}

          {step === 3 && (
            <>
              <p className="text-sm text-gray-500 -mt-2 mb-4">Todos los campos son opcionales.</p>
              <Field label="Empresa / Empleador">
                <input value={data.employer} onChange={(e) => set("employer", e.target.value)} placeholder="Nombre de la empresa" className={input} />
              </Field>
              <Field label="Puesto de trabajo">
                <input value={data.position} onChange={(e) => set("position", e.target.value)} placeholder="Desarrollador, profesor..." className={input} />
              </Field>
              <Field label="Ingresos mensuales netos (€)">
                <input type="number" value={data.monthly_income} onChange={(e) => set("monthly_income", e.target.value)} placeholder="1500" className={input} />
              </Field>
            </>
          )}

          {step === 4 && (
            <>
              <Field label="Nombre del contacto de emergencia *">
                <input value={data.emergency_contact_name} onChange={(e) => set("emergency_contact_name", e.target.value)} placeholder="Nombre y apellidos" className={input} />
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Teléfono *">
                  <input value={data.emergency_contact_phone} onChange={(e) => set("emergency_contact_phone", e.target.value)} placeholder="+34 612 345 678" className={input} />
                </Field>
                <Field label="Relación *">
                  <input value={data.emergency_contact_relationship} onChange={(e) => set("emergency_contact_relationship", e.target.value)} placeholder="Madre, pareja..." className={input} />
                </Field>
              </div>

              <div className="pt-2 border-t border-gray-100">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Avalista (opcional)</p>
                <div className="space-y-4">
                  <Field label="Nombre del avalista">
                    <input value={data.guarantor_name} onChange={(e) => set("guarantor_name", e.target.value)} placeholder="Nombre y apellidos" className={input} />
                  </Field>
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Teléfono">
                      <input value={data.guarantor_phone} onChange={(e) => set("guarantor_phone", e.target.value)} placeholder="+34 600 000 000" className={input} />
                    </Field>
                    <Field label="DNI / NIE">
                      <input value={data.guarantor_id_number} onChange={(e) => set("guarantor_id_number", e.target.value)} placeholder="12345678A" className={input} />
                    </Field>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Error */}
        {error && (
          <p className="mt-4 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between mt-8">
          {step > 0 ? (
            <button onClick={() => { setStep(step - 1); setError(null); }} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 transition-colors">
              <ChevronLeft className="w-4 h-4" /> Atrás
            </button>
          ) : <div />}

          <button
            onClick={next}
            disabled={isPending}
            className="flex items-center gap-1.5 bg-olive-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-olive-700 transition-colors disabled:opacity-50"
          >
            {step === STEPS.length - 1 ? (isPending ? "Guardando..." : "Finalizar") : "Siguiente"}
            {step < STEPS.length - 1 && <ChevronRight className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {children}
    </div>
  );
}

const input = "w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-olive-500";
