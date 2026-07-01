"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Plus, ChevronRight, ChevronLeft, Building2, Check, ChevronDown, X } from "lucide-react";

const ROOM_AMENITIES = [
  { key: "wifi",       label: "WiFi" },
  { key: "desk",       label: "Escritorio" },
  { key: "wardrobe",   label: "Armario" },
  { key: "ac",         label: "Aire acondicionado" },
  { key: "heating",    label: "Calefacción" },
  { key: "ensuite",    label: "Baño privado" },
  { key: "balcony",    label: "Balcón" },
  { key: "double_bed", label: "Cama doble" },
  { key: "fridge",     label: "Nevera" },
];

const PROPERTY_AMENITIES = [
  "Piscina", "Jardín", "Terraza", "Sala común", "Cocina compartida",
  "Lavandería", "Gimnasio", "Parking", "Ascensor", "Conserjería",
  "Sala de estudio", "Trastero bicicletas",
];

const PROPERTY_TYPES = [
  "Piso compartido", "Residencia de estudiantes", "Casa compartida", "Coliving", "Unifamiliar",
];

type RoomDraft = { number: string; monthly_rent: string; deposit_amount: string; amenities: string[] };

export default function AddPropertyDialog() {
  const [open, setOpen]         = useState(false);
  const [step, setStep]         = useState(0);
  const [error, setError]       = useState<string | null>(null);
  const [done, setDone]         = useState(false);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const [property, setProperty] = useState({
    name: "", address: "", city: "Madrid", postal_code: "",
    type: "Piso compartido", amenities: [] as string[],
  });

  const [template, setTemplate] = useState({
    count: 1,
    monthly_rent: "",
    deposit_amount: "",
    amenities: ["wifi", "desk", "wardrobe"] as string[],
  });

  const [roomList, setRoomList] = useState<RoomDraft[]>([]);

  function setProp(field: keyof typeof property) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setProperty((p) => ({ ...p, [field]: e.target.value }));
  }

  function setTpl(field: keyof typeof template) {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = field === "count" ? Math.max(1, Math.min(50, Number(e.target.value))) : e.target.value;
      setTemplate((t) => ({ ...t, [field]: value }));
    };
  }

  function toggleTemplateAmenity(key: string) {
    setTemplate((t) => ({
      ...t,
      amenities: t.amenities.includes(key) ? t.amenities.filter((a) => a !== key) : [...t.amenities, key],
    }));
  }

  function toggleRoomAmenity(index: number, key: string) {
    setRoomList((prev) => prev.map((r, i) => {
      if (i !== index) return r;
      return { ...r, amenities: r.amenities.includes(key) ? r.amenities.filter((a) => a !== key) : [...r.amenities, key] };
    }));
  }

  function updateRoom(index: number, field: "monthly_rent" | "deposit_amount", value: string) {
    setRoomList((prev) => prev.map((r, i) => i === index ? { ...r, [field]: value } : r));
  }

  function goToHabitaciones() {
    if (!property.name.trim()) { setError("El nombre es obligatorio."); return; }
    if (!property.address.trim()) { setError("La dirección es obligatoria."); return; }
    if (!property.city.trim()) { setError("La ciudad es obligatoria."); return; }
    setError(null);
    setStep(1);
  }

  function goToAjustar() {
    if (!template.monthly_rent || Number(template.monthly_rent) <= 0) {
      setError("La renta mensual es obligatoria."); return;
    }
    setError(null);
    setRoomList(
      Array.from({ length: template.count }, (_, i) => ({
        number: String(i + 1),
        monthly_rent: template.monthly_rent,
        deposit_amount: template.deposit_amount,
        amenities: [...template.amenities],
      }))
    );
    setStep(2);
  }

  function handleSubmit() {
    for (const r of roomList) {
      if (!r.monthly_rent || Number(r.monthly_rent) <= 0) {
        setError(`La habitación ${r.number} necesita una renta válida.`); return;
      }
    }
    setError(null);

    startTransition(async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setError("No autenticado."); return; }

      const { data: prop, error: propErr } = await supabase
        .from("properties")
        .insert({ landlord_id: user.id, name: property.name, address: property.address, city: property.city, postal_code: property.postal_code || "", country: "España", amenities: property.amenities })
        .select("id").single();

      if (propErr || !prop) { setError(propErr?.message ?? "Error al crear la propiedad."); return; }

      const rows = roomList.map((r) => ({
        property_id: prop.id,
        number: r.number,
        monthly_rent: Number(r.monthly_rent),
        deposit_amount: r.deposit_amount ? Number(r.deposit_amount) : Number(r.monthly_rent) * 2,
        amenities: r.amenities,
        status: "vacant" as const,
      }));

      const { error: roomsErr } = await supabase.from("rooms").insert(rows);
      if (roomsErr) { setError(roomsErr.message); return; }

      setDone(true);
      router.refresh();
    });
  }

  function close() {
    setOpen(false); setStep(0); setDone(false); setError(null); setExpanded(null);
    setProperty({ name: "", address: "", city: "Madrid", postal_code: "", type: "Piso compartido", amenities: [] });
    setTemplate({ count: 1, monthly_rent: "", deposit_amount: "", amenities: ["wifi", "desk", "wardrobe"] });
    setRoomList([]);
  }

  const STEPS = ["Propiedad", "Habitaciones", "Ajustar"];

  return (
    <>
      <button onClick={() => setOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-olive-600 text-white text-sm font-medium rounded-lg hover:bg-olive-700 transition-colors">
        <Plus className="w-4 h-4" /> Nueva propiedad
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">

            {/* Header */}
            <div className="px-6 pt-6 pb-4 border-b border-gray-100 flex-shrink-0">
              <h3 className="font-semibold text-gray-900">Nueva propiedad</h3>
              <div className="flex gap-1 mt-3">
                {STEPS.map((s, i) => (
                  <div key={s} className="flex-1">
                    <div className={`h-1 rounded-full transition-colors ${i <= step ? "bg-olive-600" : "bg-gray-200"}`} />
                    <p className={`text-xs mt-1 ${i === step ? "text-olive-600 font-medium" : "text-gray-400"}`}>{s}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Body */}
            <div className="px-6 py-5 space-y-4 overflow-y-auto flex-1">
              {done ? (
                <div className="text-center py-8">
                  <div className="w-14 h-14 bg-olive-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Building2 className="w-7 h-7 text-olive-600" />
                  </div>
                  <p className="font-semibold text-gray-900 text-lg">{property.name}</p>
                  <p className="text-sm text-gray-500 mt-1">Creada con {roomList.length} habitación{roomList.length !== 1 ? "es" : ""}.</p>
                </div>

              ) : step === 0 ? (
                <>
                  <Field label="Nombre / identificador *">
                    <input value={property.name} onChange={setProp("name")} placeholder="Ej: Calle Alcalá 45" className={inp} />
                  </Field>
                  <Field label="Tipo de propiedad">
                    <select value={property.type} onChange={setProp("type")} className={inp}>
                      {PROPERTY_TYPES.map((t) => <option key={t}>{t}</option>)}
                    </select>
                  </Field>
                  <Field label="Dirección completa *">
                    <input value={property.address} onChange={setProp("address")} placeholder="Calle Mayor 12, 3º izq" className={inp} />
                  </Field>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Ciudad *">
                      <input value={property.city} onChange={setProp("city")} className={inp} />
                    </Field>
                    <Field label="Código postal">
                      <input value={property.postal_code} onChange={setProp("postal_code")} placeholder="28014" className={inp} />
                    </Field>
                  </div>
                  <Field label="Zonas comunes y servicios del edificio">
                    <MultiSelect
                      options={PROPERTY_AMENITIES}
                      selected={property.amenities}
                      onChange={(amenities) => setProperty((p) => ({ ...p, amenities }))}
                    />
                  </Field>
                </>

              ) : step === 1 ? (
                <>
                  <p className="text-xs text-gray-400">Valores por defecto para todas las habitaciones. Ajusta individualmente en el siguiente paso.</p>
                  <Field label="Número de habitaciones *">
                    <input type="number" min={1} max={50} value={template.count} onChange={setTpl("count")} className={inp} />
                  </Field>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Renta mensual (€) *">
                      <input type="number" min={0} value={template.monthly_rent} onChange={setTpl("monthly_rent")} placeholder="600" className={inp} />
                    </Field>
                    <Field label="Depósito (€)">
                      <input type="number" min={0} value={template.deposit_amount} onChange={setTpl("deposit_amount")} placeholder="2 meses si vacío" className={inp} />
                    </Field>
                  </div>
                  <Field label="Equipamiento incluido en cada habitación">
                    <div className="grid grid-cols-2 gap-2 mt-1">
                      {ROOM_AMENITIES.map((a) => (
                        <AmenityButton key={a.key} label={a.label} active={template.amenities.includes(a.key)} onClick={() => toggleTemplateAmenity(a.key)} />
                      ))}
                    </div>
                  </Field>
                </>

              ) : (
                <>
                  <p className="text-xs text-gray-400">Ajusta la renta y servicios de cada habitación individualmente.</p>
                  <div className="space-y-3">
                    {roomList.map((room, i) => (
                      <div key={i} className="border border-gray-200 rounded-xl p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-semibold text-gray-800">Habitación {room.number}</span>
                          <button type="button" onClick={() => setExpanded(expanded === i ? null : i)}
                            className="flex items-center gap-1 text-xs text-olive-600 hover:text-olive-800 transition-colors">
                            Servicios <ChevronDown className={`w-3.5 h-3.5 transition-transform ${expanded === i ? "rotate-180" : ""}`} />
                          </button>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <input type="number" value={room.monthly_rent} onChange={(e) => updateRoom(i, "monthly_rent", e.target.value)} placeholder="Renta (€)" className={inp} />
                          <input type="number" value={room.deposit_amount} onChange={(e) => updateRoom(i, "deposit_amount", e.target.value)} placeholder="Depósito (€)" className={inp} />
                        </div>

                        {expanded === i && (
                          <div className="grid grid-cols-2 gap-1.5 pt-2 border-t border-gray-100">
                            {ROOM_AMENITIES.map((a) => (
                              <AmenityButton key={a.key} label={a.label} active={room.amenities.includes(a.key)} onClick={() => toggleRoomAmenity(i, a.key)} small />
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </>
              )}

              {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 flex gap-2 border-t border-gray-100 flex-shrink-0">
              {done ? (
                <button onClick={close} className="w-full px-4 py-2.5 text-sm bg-olive-600 text-white rounded-lg hover:bg-olive-700 font-medium transition-colors">
                  Ver propiedades
                </button>
              ) : (
                <>
                  <button type="button" onClick={() => { if (step === 0) close(); else { setStep(step - 1); setError(null); } }}
                    className="flex items-center gap-1 px-3 py-2 text-sm border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50">
                    <ChevronLeft className="w-4 h-4" />
                    {step === 0 ? "Cancelar" : "Atrás"}
                  </button>
                  <div className="flex-1" />
                  {step === 0 && <button onClick={goToHabitaciones} className="flex items-center gap-1.5 px-4 py-2 text-sm bg-olive-600 text-white rounded-lg hover:bg-olive-700 transition-colors">Siguiente <ChevronRight className="w-4 h-4" /></button>}
                  {step === 1 && <button onClick={goToAjustar} className="flex items-center gap-1.5 px-4 py-2 text-sm bg-olive-600 text-white rounded-lg hover:bg-olive-700 transition-colors">Ajustar <ChevronRight className="w-4 h-4" /></button>}
                  {step === 2 && <button onClick={handleSubmit} disabled={isPending} className="px-4 py-2 text-sm bg-olive-600 text-white rounded-lg hover:bg-olive-700 disabled:opacity-50 font-medium transition-colors">{isPending ? "Creando..." : "Crear propiedad"}</button>}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function MultiSelect({ options, selected, onChange }: { options: string[]; selected: string[]; onChange: (val: string[]) => void }) {
  const [open, setOpen] = useState(false);
  const [custom, setCustom] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  function toggle(item: string) {
    onChange(selected.includes(item) ? selected.filter((s) => s !== item) : [...selected, item]);
  }

  function addCustom() {
    const val = custom.trim();
    if (!val || selected.includes(val)) { setCustom(""); return; }
    onChange([...selected, val]);
    setCustom("");
  }

  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-3 py-2 border border-gray-300 rounded-lg text-sm hover:border-gray-400 transition-colors bg-white">
        <span className={selected.length === 0 ? "text-gray-400" : "text-gray-700"}>
          {selected.length === 0 ? "Seleccionar servicios..." : `${selected.length} seleccionado${selected.length !== 1 ? "s" : ""}`}
        </span>
        <ChevronDown className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute z-20 top-full mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
          <div className="max-h-52 overflow-y-auto p-1">
            {options.map((opt) => {
              const active = selected.includes(opt);
              return (
                <button key={opt} type="button" onClick={() => toggle(opt)}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors text-left">
                  <span className={`w-4 h-4 rounded flex items-center justify-center flex-shrink-0 border transition-colors ${active ? "bg-olive-600 border-olive-600" : "border-gray-300"}`}>
                    {active && <Check className="w-2.5 h-2.5 text-white" />}
                  </span>
                  <span className={`text-sm ${active ? "text-gray-900 font-medium" : "text-gray-600"}`}>{opt}</span>
                </button>
              );
            })}
          </div>
          <div className="border-t border-gray-100 p-2 flex gap-2">
            <input value={custom} onChange={(e) => setCustom(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCustom())}
              placeholder="Añadir otro..." className="flex-1 px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-olive-500" />
            <button type="button" onClick={addCustom} className="px-3 py-1.5 text-sm bg-olive-600 text-white rounded-lg hover:bg-olive-700 transition-colors">Añadir</button>
          </div>
        </div>
      )}

      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {selected.map((item) => (
            <span key={item} className="flex items-center gap-1 px-2.5 py-1 bg-olive-50 text-olive-700 text-xs rounded-full border border-olive-200 font-medium">
              {item}
              <button type="button" onClick={() => toggle(item)} className="hover:text-olive-900 ml-0.5"><X className="w-3 h-3" /></button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function AmenityButton({ label, active, onClick, small }: { label: string; active: boolean; onClick: () => void; small?: boolean }) {
  return (
    <button type="button" onClick={onClick}
      className={`flex items-center gap-2 rounded-lg border transition-colors ${small ? "px-2.5 py-1.5 text-xs" : "px-3 py-2 text-sm"} ${active ? "border-olive-500 bg-olive-50 text-olive-700 font-medium" : "border-gray-200 text-gray-500 hover:border-gray-300"}`}>
      <span className={`rounded flex items-center justify-center flex-shrink-0 ${small ? "w-3.5 h-3.5" : "w-4 h-4"} ${active ? "bg-olive-600" : "bg-gray-200"}`}>
        {active && <Check className={small ? "w-2 h-2 text-white" : "w-2.5 h-2.5 text-white"} />}
      </span>
      {label}
    </button>
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
