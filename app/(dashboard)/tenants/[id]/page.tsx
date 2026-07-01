import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ChevronLeft, User, Mail, Phone, Flag, CreditCard,
  Briefcase, Phone as PhoneIcon, CalendarDays, DoorOpen,
  FileText, ArrowRight,
} from "lucide-react";
import { formatDate, formatCurrency } from "@/lib/utils";
import { differenceInDays } from "date-fns";
import { computeContractStatus } from "@/lib/contracts";
import type { Tenant, Room, Property, Payment, Contract } from "@/lib/types";
import TenantStatusBadge from "@/components/tenants/tenant-status-badge";
import EditTenantDialog from "@/components/tenants/edit-tenant-dialog";
import DeactivateTenantButton from "@/components/tenants/deactivate-tenant-button";
import PaymentStatusBadge from "@/components/payments/payment-status-badge";
import ContractStatusBadge from "@/components/contracts/contract-status-badge";
import NewContractDialog from "@/components/contracts/new-contract-dialog";
import PortalLinkButton from "@/components/tenants/portal-link-button";
import InviteTenantButton from "@/components/tenants/invite-tenant-button";

type TenantDetail = Tenant & {
  rooms: (Room & { properties: Property }) | null;
};
type PaymentRow = Payment & { rooms: Pick<Room, "number"> };
type ContractRow = Contract & {
  rooms: Pick<Room, "number"> | null;
  properties: Pick<Property, "id" | "name"> | null;
};
type TenantOption = {
  id: string; full_name: string; email: string; phone: string; id_number: string | null;
  rooms: { id: string; number: string; monthly_rent: number; deposit_amount: number;
    properties: { id: string; name: string; address: string; city: string; postal_code: string } } | null;
};

async function getTenant(id: string, landlordId: string): Promise<TenantDetail | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("tenants")
    .select("*, rooms(*, properties(*))")
    .eq("id", id)
    .eq("landlord_id", landlordId)
    .single();
  return data as TenantDetail | null;
}

async function getPayments(tenantId: string): Promise<PaymentRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("payments")
    .select("*, rooms(number)")
    .eq("tenant_id", tenantId)
    .order("due_date", { ascending: false })
    .limit(12);
  return (data ?? []) as PaymentRow[];
}

async function getContracts(tenantId: string): Promise<ContractRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("contracts")
    .select("*, rooms(number), properties(id, name)")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false });
  return (data ?? []) as ContractRow[];
}

async function getTemplatesAndTenantOption(landlordId: string, tenant: TenantDetail): Promise<{ templates: { id: string; name: string }[]; tenantOption: TenantOption }> {
  const supabase = await createClient();
  const { data: templates } = await supabase
    .from("contract_templates")
    .select("id, name")
    .eq("landlord_id", landlordId)
    .order("name");
  const tenantOption: TenantOption = {
    id: tenant.id,
    full_name: tenant.full_name,
    email: tenant.email,
    phone: tenant.phone,
    id_number: tenant.id_number,
    rooms: tenant.rooms ? {
      id: (tenant.rooms as any).id,
      number: tenant.rooms.number,
      monthly_rent: tenant.rooms.monthly_rent,
      deposit_amount: tenant.rooms.deposit_amount,
      properties: tenant.rooms.properties
        ? { id: tenant.rooms.properties.id, name: tenant.rooms.properties.name, address: tenant.rooms.properties.address, city: tenant.rooms.properties.city, postal_code: tenant.rooms.properties.postal_code }
        : { id: "", name: "", address: "", city: "", postal_code: "" },
    } : null,
  };
  return { templates: templates ?? [], tenantOption };
}

export default async function TenantDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const [tenant, payments, contracts] = await Promise.all([
    getTenant(id, user.id),
    getPayments(id),
    getContracts(id),
  ]);

  if (!tenant) notFound();

  const { templates, tenantOption } = await getTemplatesAndTenantOption(user.id, tenant);
  const enrichedContracts = contracts.map((c) => ({ ...c, status: computeContractStatus(c) }));

  const totalPaid = payments.filter((p) => p.status === "paid").reduce((s, p) => s + p.amount, 0);
  const totalPending = payments.filter((p) => p.status === "pending" || p.status === "overdue").reduce((s, p) => s + p.amount, 0);

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <Link href="/tenants" className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 mb-6 w-fit">
        <ChevronLeft className="w-4 h-4" />
        Inquilinos
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-olive-100 flex items-center justify-center flex-shrink-0">
            <span className="text-xl font-bold text-olive-700">
              {tenant.full_name.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-bold text-gray-900">{tenant.full_name}</h1>
              <TenantStatusBadge isActive={tenant.is_active} />
            </div>
            {tenant.rooms && (
              <p className="text-gray-500 mt-0.5">
                {tenant.rooms.properties?.name} · Hab. {tenant.rooms.number}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {tenant.is_active && <InviteTenantButton tenantId={tenant.id} inviteSentAt={tenant.invite_sent_at} />}
          {tenant.is_active && <PortalLinkButton tenantId={tenant.id} />}
          <EditTenantDialog tenant={tenant} />
          {tenant.is_active && <DeactivateTenantButton tenantId={tenant.id} tenantName={tenant.full_name} />}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: info */}
        <div className="lg:col-span-2 space-y-5">
          {/* Personal details */}
          <Section title="Datos personales">
            <DetailRow icon={<Mail className="w-4 h-4" />} label="Email" value={tenant.email} />
            <DetailRow icon={<Phone className="w-4 h-4" />} label="Teléfono" value={tenant.phone || "—"} />
            <DetailRow icon={<Flag className="w-4 h-4" />} label="Nacionalidad" value={tenant.nationality || "—"} />
            <DetailRow
              icon={<CalendarDays className="w-4 h-4" />}
              label="Fecha de nacimiento"
              value={tenant.date_of_birth ? formatDate(tenant.date_of_birth) : "—"}
            />
            {tenant.id_number && (
              <DetailRow
                icon={<CreditCard className="w-4 h-4" />}
                label={tenant.id_type?.toUpperCase() ?? "Documento"}
                value={tenant.id_number}
              />
            )}
          </Section>

          {/* Employment */}
          {(tenant.employer || tenant.position) && (
            <Section title="Empleo">
              {tenant.employer && <DetailRow icon={<Briefcase className="w-4 h-4" />} label="Empresa" value={tenant.employer} />}
              {tenant.position && <DetailRow icon={<User className="w-4 h-4" />} label="Puesto" value={tenant.position} />}
            </Section>
          )}

          {/* Emergency contact */}
          {(tenant.emergency_contact_name || tenant.emergency_contact_phone) && (
            <Section title="Contacto de emergencia">
              {tenant.emergency_contact_name && (
                <DetailRow icon={<User className="w-4 h-4" />} label="Nombre" value={tenant.emergency_contact_name} />
              )}
              {tenant.emergency_contact_phone && (
                <DetailRow icon={<PhoneIcon className="w-4 h-4" />} label="Teléfono" value={tenant.emergency_contact_phone} />
              )}
              {tenant.emergency_contact_relationship && (
                <DetailRow icon={<User className="w-4 h-4" />} label="Relación" value={tenant.emergency_contact_relationship} />
              )}
            </Section>
          )}

          {/* Guarantor */}
          {tenant.guarantor_name && (
            <Section title="Avalista">
              <DetailRow icon={<User className="w-4 h-4" />} label="Nombre" value={tenant.guarantor_name} />
              {tenant.guarantor_phone && <DetailRow icon={<PhoneIcon className="w-4 h-4" />} label="Teléfono" value={tenant.guarantor_phone} />}
              {tenant.guarantor_id_number && <DetailRow icon={<CreditCard className="w-4 h-4" />} label="DNI / NIE" value={tenant.guarantor_id_number} />}
            </Section>
          )}

          {/* Contracts */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Contratos</h3>
              <NewContractDialog
                activeTenants={[tenantOption]}
                templates={templates}
                defaultTenantId={tenant.id}
              />
            </div>
            {enrichedContracts.length === 0 ? (
              <p className="text-sm text-gray-400 italic py-2">Sin contratos aún.</p>
            ) : (
              <div className="divide-y divide-gray-50 -mx-5">
                {enrichedContracts.map((contract) => {
                  const daysLeft = contract.end_date
                    ? differenceInDays(new Date(contract.end_date), new Date())
                    : null;
                  return (
                    <div key={contract.id} className="flex items-center justify-between px-5 py-3 gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <ContractStatusBadge status={contract.status} />
                          {contract.properties && (
                            <span className="text-xs text-gray-400">{contract.properties.name}</span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {formatDate(contract.start_date)}
                          {" → "}
                          {contract.end_date ? (
                            <>
                              {formatDate(contract.end_date)}
                              {daysLeft !== null && daysLeft >= 0 && daysLeft <= 30 && (
                                <span className="text-amber-600 font-medium ml-1">({daysLeft}d)</span>
                              )}
                            </>
                          ) : (
                            <span className="italic text-gray-400">Indefinido</span>
                          )}
                          {" · "}{formatCurrency(contract.monthly_rent)}/mes
                        </p>
                      </div>
                      <Link
                        href={`/contracts/${contract.id}`}
                        className="flex items-center gap-1 text-xs text-olive-600 hover:underline font-medium shrink-0"
                      >
                        Ver <ArrowRight className="w-3 h-3" />
                      </Link>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Payment history */}
          <Section title="Historial de pagos">
            {payments.length === 0 ? (
              <p className="text-sm text-gray-400 italic py-2">Sin registros de pago aún.</p>
            ) : (
              <div className="divide-y divide-gray-50 -mx-5">
                {payments.map((payment) => (
                  <div key={payment.id} className="flex items-center justify-between px-5 py-3">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {formatCurrency(payment.amount)}
                      </p>
                      <p className="text-xs text-gray-400">
                        Vence {formatDate(payment.due_date)}
                        {payment.paid_date && ` · Pagado ${formatDate(payment.paid_date)}`}
                      </p>
                    </div>
                    <PaymentStatusBadge status={payment.status} />
                  </div>
                ))}
              </div>
            )}
          </Section>
        </div>

        {/* Right column: sidebar */}
        <div className="space-y-5">
          {/* Room assignment */}
          <Section title="Habitación">
            {tenant.rooms ? (
              <div className="space-y-2">
                <Link
                  href={`/properties/${tenant.rooms.properties?.id}`}
                  className="block text-sm font-medium text-olive-600 hover:underline"
                >
                  {tenant.rooms.properties?.name}
                </Link>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <DoorOpen className="w-4 h-4 text-gray-300" />
                  Habitación {tenant.rooms.number}
                </div>
                <p className="text-sm text-gray-600">
                  {formatCurrency(tenant.rooms.monthly_rent)}/mes
                </p>
              </div>
            ) : (
              <p className="text-sm text-gray-400 italic">Sin habitación asignada</p>
            )}
          </Section>

          {/* Contract dates */}
          <Section title="Estancia">
            <DetailRow
              icon={<CalendarDays className="w-4 h-4" />}
              label="Entrada"
              value={tenant.move_in_date ? formatDate(tenant.move_in_date) : "—"}
            />
            <DetailRow
              icon={<CalendarDays className="w-4 h-4" />}
              label="Salida prevista"
              value={tenant.move_out_date ? formatDate(tenant.move_out_date) : "Indefinida"}
            />
          </Section>

          {/* Payment summary */}
          {payments.length > 0 && (
            <Section title="Resumen pagos">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Total cobrado</span>
                  <span className="font-semibold text-emerald-600">{formatCurrency(totalPaid)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Pendiente</span>
                  <span className={`font-semibold ${totalPending > 0 ? "text-amber-600" : "text-gray-400"}`}>
                    {formatCurrency(totalPending)}
                  </span>
                </div>
                <div className="flex justify-between text-sm pt-2 border-t border-gray-100">
                  <span className="text-gray-500">Pagos registrados</span>
                  <span className="font-semibold text-gray-700">{payments.length}</span>
                </div>
              </div>
            </Section>
          )}
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">{title}</h3>
      {children}
    </div>
  );
}

function DetailRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 py-1.5">
      <span className="text-gray-300 mt-0.5 flex-shrink-0">{icon}</span>
      <div className="flex-1 min-w-0">
        <span className="text-xs text-gray-400 block">{label}</span>
        <span className="text-sm text-gray-800 font-medium">{value}</span>
      </div>
    </div>
  );
}
