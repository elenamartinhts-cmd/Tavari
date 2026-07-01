import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  DoorOpen, MapPin, CreditCard, CheckCircle2, Clock, AlertCircle,
  User, Phone, Mail, Calendar, Shield, FileText, Briefcase, Flag,
  Wrench, ChevronRight,
} from "lucide-react";
import ContactForm from "@/components/tenant-portal/contact-form";
import PortalContracts from "@/components/tenant-portal/portal-contracts";
import ExpenseNotifications from "@/components/tenant-portal/expense-notifications";

async function getTenantPortalData(tenantId: string) {
  const supabase = createAdminClient();

  const { data: tenant } = await supabase
    .from("tenants")
    .select(`
      id, full_name, is_active, move_in_date, email, phone,
      date_of_birth, nationality, current_address,
      id_type, id_number, id_expiry_date,
      employer, position, monthly_income,
      emergency_contact_name, emergency_contact_phone, emergency_contact_relationship,
      guarantor_name, guarantor_phone, guarantor_id_number,
      rooms ( id, number, monthly_rent, deposit_amount, properties ( id, name, address, city ) )
    `)
    .eq("id", tenantId)
    .single();

  if (!tenant || !tenant.is_active) return null;

  const { data: issues } = await supabase
    .from("maintenance_issues")
    .select("id, title, category, priority, status, created_at")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false })
    .limit(20);

  const { data: contracts } = await supabase
    .from("contracts")
    .select(`
      id, status, start_date, end_date, monthly_rent, deposit_amount,
      signed_landlord_at, signed_tenant_at, generated_content,
      properties ( name ), rooms ( number )
    `)
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false });

  const { data: notifications } = await supabase
    .from("tenant_notifications")
    .select("id, title, data, read_at, created_at")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false })
    .limit(20);

  const { data: payments } = await supabase
    .from("payments")
    .select("id, amount, due_date, paid_date, status, notes")
    .eq("tenant_id", tenantId)
    .order("due_date", { ascending: false })
    .limit(24);

  return {
    tenant,
    issues: issues ?? [],
    contracts: contracts ?? [],
    notifications: notifications ?? [],
    payments: payments ?? [],
  };
}

const paymentStatusConfig = {
  paid:    { label: "Pagado",    color: "text-emerald-700 bg-emerald-50",  icon: CheckCircle2 },
  pending: { label: "Pendiente", color: "text-amber-700 bg-amber-50",      icon: Clock },
  overdue: { label: "Vencido",   color: "text-red-700 bg-red-50",          icon: AlertCircle },
  partial: { label: "Parcial",   color: "text-orange-700 bg-orange-50",    icon: Clock },
} as const;

const issueStatusConfig: Record<string, { label: string; color: string }> = {
  open:           { label: "Abierta",         color: "text-red-700 bg-red-50" },
  in_progress:    { label: "En proceso",      color: "text-blue-700 bg-blue-50" },
  waiting_tenant: { label: "Esperando",       color: "text-amber-700 bg-amber-50" },
  resolved:       { label: "Resuelta",        color: "text-emerald-700 bg-emerald-50" },
  closed:         { label: "Cerrada",         color: "text-gray-600 bg-gray-100" },
};

const idTypeLabel: Record<string, string> = { dni: "DNI", nie: "NIE", passport: "Pasaporte" };

export default async function TenantPortalPage({ params }: { params: Promise<{ tenantId: string }> }) {
  const { tenantId } = await params;
  const data = await getTenantPortalData(tenantId);
  if (!data) notFound();

  const { tenant, issues, contracts, notifications, payments } = data;
  const room = tenant.rooms as any;
  const property = room?.properties;

  const firstName = tenant.full_name.split(" ")[0];
  const openIssues     = issues.filter((i: any) => i.status !== "resolved" && i.status !== "closed");
  const resolvedIssues = issues.filter((i: any) => i.status === "resolved" || i.status === "closed");

  const totalPending = payments.filter((p: any) => p.status === "pending" || p.status === "overdue").reduce((s: number, p: any) => s + p.amount, 0);

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">

      {/* Header */}
      <div id="inicio" className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-olive-100 flex items-center justify-center flex-shrink-0">
          <span className="text-xl font-bold text-olive-700">{firstName.charAt(0).toUpperCase()}</span>
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Hola, {firstName}</h1>
          {room && property && (
            <p className="text-gray-500 mt-0.5 text-sm">{property.name} · Habitación {room.number}</p>
          )}
        </div>
      </div>

      {/* Expense notifications */}
      <ExpenseNotifications notifications={notifications as any} tenantId={tenantId} />

      {/* Quick stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <StatCard
          label="Renta mensual"
          value={room ? formatCurrency(room.monthly_rent) : "—"}
          sub={tenant.move_in_date ? `Desde ${formatDate(tenant.move_in_date)}` : undefined}
        />
        <StatCard
          label="Pendiente"
          value={formatCurrency(totalPending)}
          sub={`${payments.filter((p: any) => p.status === "pending" || p.status === "overdue").length} pagos`}
          red={totalPending > 0}
        />
      </div>

      {/* Room info */}
      {room && (
        <Section title="Tu habitación">
          <div className="flex items-start gap-4 py-1">
            <div className="w-12 h-12 rounded-xl bg-olive-50 flex items-center justify-center flex-shrink-0">
              <DoorOpen className="w-6 h-6 text-olive-500" />
            </div>
            <div className="space-y-1.5 text-sm">
              <p className="font-semibold text-gray-900">Habitación {room.number}</p>
              {property && (
                <div className="flex items-center gap-1.5 text-gray-500">
                  <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                  {property.address}, {property.city}
                </div>
              )}
              <div className="flex items-center gap-4 text-gray-600">
                <span>Renta: <span className="font-medium text-gray-900">{formatCurrency(room.monthly_rent)}/mes</span></span>
                {room.deposit_amount > 0 && (
                  <span>Depósito: <span className="font-medium text-gray-900">{formatCurrency(room.deposit_amount)}</span></span>
                )}
              </div>
            </div>
          </div>
        </Section>
      )}

      {/* Payments */}
      <Section id="pagos" title="Historial de pagos">
        {payments.length === 0 ? (
          <p className="text-sm text-gray-400 italic py-2">Sin registros de pago aún.</p>
        ) : (
          <div className="divide-y divide-gray-50 -mx-5">
            {payments.map((p: any) => {
              const cfg = paymentStatusConfig[p.status as keyof typeof paymentStatusConfig] ?? paymentStatusConfig.pending;
              const Icon = cfg.icon;
              return (
                <div key={p.id} className="flex items-center justify-between px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center flex-shrink-0">
                      <CreditCard className="w-4 h-4 text-gray-400" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{formatCurrency(p.amount)}</p>
                      <p className="text-xs text-gray-500">
                        Vence: {formatDate(p.due_date)}
                        {p.paid_date && <> · Pagado: {formatDate(p.paid_date)}</>}
                      </p>
                      {p.notes && <p className="text-xs text-gray-400 mt-0.5">{p.notes}</p>}
                    </div>
                  </div>
                  <span className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full ${cfg.color}`}>
                    <Icon className="w-3 h-3" />
                    {cfg.label}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </Section>

      {/* Contracts */}
      <div id="contratos">
        <Section title="Contratos">
          {contracts.length === 0 ? (
            <p className="text-sm text-gray-400 italic py-2">Sin contratos aún.</p>
          ) : (
            <PortalContracts contracts={contracts as any} tenantId={tenantId} />
          )}
        </Section>
      </div>

      {/* Issues */}
      <div id="incidencias">
        <Section title="Reportar una incidencia">
          <ContactForm tenantId={tenantId} tenantName={tenant.full_name} />
        </Section>

        {openIssues.length > 0 && (
          <div className="mt-4">
            <Section title="Mis incidencias abiertas">
              <IssueList issues={openIssues} />
            </Section>
          </div>
        )}

        {resolvedIssues.length > 0 && (
          <div className="mt-4">
            <Section title="Incidencias resueltas">
              <IssueList issues={resolvedIssues} muted />
            </Section>
          </div>
        )}
      </div>

      {/* Personal info */}
      <div id="mis-datos" className="space-y-4">
        <Section title="Datos personales">
          <DetailRow icon={Mail}     label="Email"              value={tenant.email} />
          <DetailRow icon={Phone}    label="Teléfono"           value={tenant.phone || null} />
          <DetailRow icon={Flag}     label="Nacionalidad"       value={tenant.nationality} />
          <DetailRow icon={Calendar} label="Fecha de nacimiento" value={tenant.date_of_birth ? formatDate(tenant.date_of_birth) : null} />
          <DetailRow icon={MapPin}   label="Domicilio anterior" value={tenant.current_address} />
          {tenant.id_number && (
            <DetailRow icon={FileText} label={idTypeLabel[tenant.id_type ?? ""] ?? "Documento"} value={tenant.id_number} />
          )}
          {tenant.id_expiry_date && (
            <DetailRow icon={Calendar} label="Caducidad doc." value={formatDate(tenant.id_expiry_date)} />
          )}
        </Section>

        {(tenant.employer || tenant.position) && (
          <Section title="Empleo">
            <DetailRow icon={Briefcase} label="Empresa" value={tenant.employer} />
            <DetailRow icon={User}      label="Puesto"  value={tenant.position} />
            {tenant.monthly_income && (
              <DetailRow icon={CreditCard} label="Ingresos mensuales" value={formatCurrency(tenant.monthly_income)} />
            )}
          </Section>
        )}

        {tenant.emergency_contact_name && (
          <Section title="Contacto de emergencia">
            <DetailRow icon={User}   label="Nombre"   value={tenant.emergency_contact_name} />
            <DetailRow icon={Phone}  label="Teléfono" value={tenant.emergency_contact_phone} />
            <DetailRow icon={Shield} label="Relación" value={tenant.emergency_contact_relationship} />
          </Section>
        )}

        {tenant.guarantor_name && (
          <Section title="Avalista">
            <DetailRow icon={User}     label="Nombre"   value={tenant.guarantor_name} />
            <DetailRow icon={Phone}    label="Teléfono" value={tenant.guarantor_phone} />
            <DetailRow icon={FileText} label="DNI / NIE" value={tenant.guarantor_id_number} />
          </Section>
        )}
      </div>
    </div>
  );
}

function Section({ title, children, id }: { title: string; children: React.ReactNode; id?: string }) {
  return (
    <div id={id} className="bg-white rounded-xl border border-gray-200 p-5">
      <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">{title}</h2>
      {children}
    </div>
  );
}

function StatCard({ label, value, sub, green, red }: { label: string; value: string; sub?: string; green?: boolean; red?: boolean }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">{label}</p>
      <p className={`text-2xl font-bold ${green ? "text-emerald-600" : red ? "text-red-600" : "text-gray-900"}`}>{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

function DetailRow({ icon: Icon, label, value }: { icon: any; label: string; value: string | null | undefined }) {
  if (!value) return null;
  return (
    <div className="flex items-center gap-3 py-1.5 text-sm border-b border-gray-50 last:border-0">
      <Icon className="w-4 h-4 text-gray-400 flex-shrink-0" />
      <span className="text-gray-500 w-44 flex-shrink-0">{label}</span>
      <span className="text-gray-900 font-medium">{value}</span>
    </div>
  );
}

function IssueList({ issues, muted }: { issues: any[]; muted?: boolean }) {
  const priorityColor: Record<string, string> = {
    urgent: "bg-red-500",
    medium: "bg-amber-400",
    low:    "bg-gray-300",
  };
  return (
    <div className="divide-y divide-gray-50 -mx-5">
      {issues.map((issue) => {
        const st = issueStatusConfig[issue.status] ?? issueStatusConfig.open;
        return (
          <div key={issue.id} className={`flex items-center justify-between px-5 py-3 gap-3 ${muted ? "opacity-60" : ""}`}>
            <div className="flex items-center gap-3 min-w-0">
              <div className={`w-2 h-2 rounded-full flex-shrink-0 ${priorityColor[issue.priority] ?? "bg-gray-300"}`} />
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{issue.title}</p>
                <p className="text-xs text-gray-400">{issue.category} · {formatDate(issue.created_at)}</p>
              </div>
            </div>
            <span className={`text-xs font-medium px-2.5 py-1 rounded-full flex-shrink-0 ${st.color}`}>{st.label}</span>
          </div>
        );
      })}
    </div>
  );
}
