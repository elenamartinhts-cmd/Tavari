import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ChevronLeft, MapPin, DoorOpen, CalendarDays,
  CreditCard, FileCheck, FileX, Clock, Send,
} from "lucide-react";
import { formatDate, formatCurrency } from "@/lib/utils";
import { computeContractStatus } from "@/lib/contracts";
import type { Contract, Tenant, Room, Property } from "@/lib/types";
import ContractStatusBadge from "@/components/contracts/contract-status-badge";
import SignContractButton from "@/components/contracts/sign-contract-buttons";
import UpdateContractStatusDialog from "@/components/contracts/update-contract-status-dialog";
import TerminateContractDialog from "@/components/contracts/terminate-contract-dialog";
import ContractContentViewer from "@/components/contracts/contract-content-viewer";
import PortalLinkButton from "@/components/tenants/portal-link-button";

type ContractDetail = Contract & {
  tenants: Tenant;
  rooms: (Room & { properties: Property }) | null;
  properties: Property | null;
};

async function getContract(id: string, landlordId: string): Promise<ContractDetail | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("contracts")
    .select("*, tenants(*), rooms(*, properties(*)), properties(*)")
    .eq("id", id)
    .eq("landlord_id", landlordId)
    .single();
  return data as ContractDetail | null;
}

export default async function ContractDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const contractRaw = await getContract(id, user.id);
  if (!contractRaw) notFound();

  const contract = { ...contractRaw, status: computeContractStatus(contractRaw) };

  const landlordSigned = !!contract.signed_landlord_at;
  const tenantSigned   = !!contract.signed_tenant_at;
  const bothSigned     = landlordSigned && tenantSigned;
  const isTerminated   = contract.status === "terminated";
  const isExpired      = contract.status === "expired";
  const isClosed       = isTerminated || isExpired;

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <Link href="/contracts" className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 mb-6 w-fit">
        <ChevronLeft className="w-4 h-4" />
        Contratos
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
            <h1 className="text-2xl font-bold text-gray-900">
              Contrato · {contract.tenants.full_name}
            </h1>
            <ContractStatusBadge status={contract.status} />
          </div>
          <p className="text-gray-500 text-sm">Creado el {formatDate(contract.created_at)}</p>
        </div>
        {!isClosed && (
          <div className="flex items-center gap-2">
            <UpdateContractStatusDialog contract={contractRaw} />
            <TerminateContractDialog contractId={contract.id} currentEndDate={contractRaw.end_date} />
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left */}
        <div className="lg:col-span-2 space-y-5">

          {/* ── Signature flow ── */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">
              Proceso de firma
            </h3>

            {/* Step 1 — Landlord */}
            <Step
              number={1}
              label="Firma del arrendador"
              done={landlordSigned}
              doneLabel={`Firmado el ${formatDate(contract.signed_landlord_at!)}`}
            >
              {!isClosed && !landlordSigned && (
                <SignContractButton contractId={contract.id} />
              )}
            </Step>

            {/* Step 2 — Tenant */}
            <Step
              number={2}
              label={`Firma de ${contract.tenants.full_name}`}
              done={tenantSigned}
              doneLabel={`Firmado el ${formatDate(contract.signed_tenant_at!)}`}
              locked={!landlordSigned}
              lockedLabel="El arrendador debe firmar primero"
            >
              {landlordSigned && !tenantSigned && !isClosed && (
                <div className="mt-2 space-y-2">
                  <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 px-3 py-2 rounded-lg">
                    <Clock className="w-3.5 h-3.5 flex-shrink-0" />
                    Esperando la firma del inquilino
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Send className="w-3.5 h-3.5 flex-shrink-0" />
                    Envía el enlace del portal al inquilino para que pueda firmar:
                  </div>
                  <PortalLinkButton tenantId={contract.tenants.id} />
                </div>
              )}
            </Step>

            {bothSigned && (
              <div className="mt-4 flex items-center gap-2 text-emerald-700 bg-emerald-50 rounded-lg px-4 py-2.5 text-sm font-medium">
                <FileCheck className="w-4 h-4" />
                Contrato firmado por ambas partes · activo
              </div>
            )}
          </div>

          {/* Contract content */}
          {contract.generated_content ? (
            <ContractContentViewer
              content={contract.generated_content}
              contractId={contract.id}
              tenantName={contract.tenants.full_name}
            />
          ) : (
            <div className="bg-white rounded-xl border border-dashed border-gray-300 p-8 text-center">
              <FileX className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-400">Sin contenido generado para este contrato.</p>
            </div>
          )}
        </div>

        {/* Right sidebar */}
        <div className="space-y-5">
          <Section title="Inquilino">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-olive-100 flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-bold text-olive-700">
                  {contract.tenants.full_name.charAt(0)}
                </span>
              </div>
              <div>
                <Link href={`/tenants/${contract.tenants.id}`} className="text-sm font-medium text-olive-600 hover:underline">
                  {contract.tenants.full_name}
                </Link>
                <p className="text-xs text-gray-400">{contract.tenants.email}</p>
              </div>
            </div>
          </Section>

          {(contract.properties || contract.rooms) && (
            <Section title="Ubicación">
              {contract.properties && (
                <DetailRow icon={<MapPin className="w-4 h-4" />} label="Propiedad">
                  <Link href={`/properties/${contract.properties.id}`} className="text-sm font-medium text-olive-600 hover:underline">
                    {contract.properties.name}
                  </Link>
                </DetailRow>
              )}
              {contract.rooms && (
                <DetailRow icon={<DoorOpen className="w-4 h-4" />} label="Habitación">
                  <span className="text-sm text-gray-800">Hab. {contract.rooms.number}</span>
                </DetailRow>
              )}
            </Section>
          )}

          <Section title="Vigencia">
            <DetailRow icon={<CalendarDays className="w-4 h-4" />} label="Inicio">
              <span className="text-sm text-gray-800">{formatDate(contract.start_date)}</span>
            </DetailRow>
            <DetailRow icon={<CalendarDays className="w-4 h-4" />} label="Fin">
              <span className="text-sm text-gray-800">
                {contract.end_date ? formatDate(contract.end_date) : "Indefinido"}
              </span>
            </DetailRow>
          </Section>

          <Section title="Condiciones económicas">
            <DetailRow icon={<CreditCard className="w-4 h-4" />} label="Renta mensual">
              <span className="text-sm font-semibold text-gray-900">{formatCurrency(contract.monthly_rent)}</span>
            </DetailRow>
            <DetailRow icon={<CreditCard className="w-4 h-4" />} label="Fianza">
              <span className="text-sm font-semibold text-gray-900">{formatCurrency(contract.deposit_amount)}</span>
            </DetailRow>
          </Section>

          {contract.notes && (
            <Section title="Notas">
              <p className="text-sm text-gray-600 whitespace-pre-wrap">{contract.notes}</p>
            </Section>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function Step({
  number, label, done, doneLabel, locked, lockedLabel, children,
}: {
  number: number; label: string;
  done: boolean; doneLabel?: string;
  locked?: boolean; lockedLabel?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex gap-4 mb-5 last:mb-0">
      <div className="flex flex-col items-center">
        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
          done ? "bg-emerald-500 text-white" : locked ? "bg-gray-100 text-gray-400" : "bg-olive-100 text-olive-700"
        }`}>
          {done ? (
            <svg viewBox="0 0 12 12" className="w-3.5 h-3.5" fill="none">
              <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          ) : number}
        </div>
        {number < 2 && <div className={`w-0.5 h-6 mt-1 ${done ? "bg-emerald-200" : "bg-gray-100"}`} />}
      </div>
      <div className="flex-1 pb-1">
        <p className={`text-sm font-medium ${locked ? "text-gray-400" : "text-gray-800"}`}>{label}</p>
        {done && doneLabel && <p className="text-xs text-emerald-600 mt-0.5">{doneLabel}</p>}
        {locked && lockedLabel && <p className="text-xs text-gray-400 mt-0.5">{lockedLabel}</p>}
        {children}
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

function DetailRow({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2.5 py-1.5">
      <span className="text-gray-300 mt-0.5 flex-shrink-0">{icon}</span>
      <div>
        <p className="text-xs text-gray-400">{label}</p>
        {children}
      </div>
    </div>
  );
}
