"use client";

import { useState, useTransition } from "react";
import { FileText, FileCheck, Clock, AlertCircle, ChevronDown, ChevronUp } from "lucide-react";
import { formatDate, formatCurrency } from "@/lib/utils";
import { portalSignContract } from "@/app/portal/actions";

type PortalContract = {
  id: string;
  status: string;
  start_date: string;
  end_date: string | null;
  monthly_rent: number;
  deposit_amount: number;
  signed_landlord_at: string | null;
  signed_tenant_at: string | null;
  generated_content: string | null;
  properties: { name: string } | null;
  rooms: { number: string } | null;
};

export default function PortalContracts({
  contracts,
  tenantId,
}: {
  contracts: PortalContract[];
  tenantId: string;
}) {
  if (contracts.length === 0) return null;

  const pending = contracts.filter((c) => c.signed_landlord_at && !c.signed_tenant_at);
  const active  = contracts.filter((c) => c.signed_landlord_at && c.signed_tenant_at);
  const draft   = contracts.filter((c) => !c.signed_landlord_at);

  return (
    <div className="space-y-4">
      {pending.length > 0 && (
        <div className="bg-white rounded-xl border border-amber-200 overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-4 bg-amber-50 border-b border-amber-200">
            <Clock className="w-4 h-4 text-amber-600" />
            <h2 className="font-semibold text-amber-800 text-sm">
              {pending.length === 1 ? "Contrato pendiente de tu firma" : `${pending.length} contratos pendientes de tu firma`}
            </h2>
          </div>
          <ul className="divide-y divide-gray-50">
            {pending.map((c) => (
              <ContractRow key={c.id} contract={c} tenantId={tenantId} canSign />
            ))}
          </ul>
        </div>
      )}

      {active.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900 text-sm">Contratos activos</h2>
          </div>
          <ul className="divide-y divide-gray-50">
            {active.map((c) => (
              <ContractRow key={c.id} contract={c} tenantId={tenantId} canSign={false} />
            ))}
          </ul>
        </div>
      )}

      {draft.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden opacity-60">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-700 text-sm">En preparación</h2>
          </div>
          <ul className="divide-y divide-gray-50">
            {draft.map((c) => (
              <ContractRow key={c.id} contract={c} tenantId={tenantId} canSign={false} />
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function ContractRow({
  contract,
  tenantId,
  canSign,
}: {
  contract: PortalContract;
  tenantId: string;
  canSign: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [signed, setSigned] = useState(false);

  function handleSign() {
    setError(null);
    startTransition(async () => {
      const result = await portalSignContract(tenantId, contract.id);
      if (result.error) {
        setError(result.error);
      } else {
        setSigned(true);
        setConfirmOpen(false);
      }
    });
  }

  const signed_at = signed || !!contract.signed_tenant_at;

  return (
    <li className="px-5 py-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-medium text-gray-900">
              {contract.properties?.name ?? "Propiedad"}
              {contract.rooms ? ` · Hab. ${contract.rooms.number}` : ""}
            </p>
            {signed_at ? (
              <span className="inline-flex items-center gap-1 text-xs text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                <FileCheck className="w-3 h-3" /> Firmado
              </span>
            ) : canSign ? (
              <span className="inline-flex items-center gap-1 text-xs text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
                <Clock className="w-3 h-3" /> Pendiente de tu firma
              </span>
            ) : null}
          </div>
          <p className="text-xs text-gray-400 mt-0.5">
            {formatDate(contract.start_date)}
            {contract.end_date ? ` → ${formatDate(contract.end_date)}` : " · Sin fecha de fin"}
            {" · "}{formatCurrency(contract.monthly_rent)}/mes
          </p>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {contract.generated_content && (
            <button
              onClick={() => setExpanded((v) => !v)}
              className="text-xs text-gray-400 hover:text-gray-700 flex items-center gap-1"
            >
              {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              <span className="hidden sm:inline">{expanded ? "Ocultar" : "Ver contrato"}</span>
            </button>
          )}
          {canSign && !signed_at && (
            <button
              onClick={() => setConfirmOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-olive-600 text-white rounded-lg hover:bg-olive-700 transition-colors"
            >
              <FileText className="w-3.5 h-3.5" />
              Firmar
            </button>
          )}
        </div>
      </div>

      {/* Contract content preview */}
      {expanded && contract.generated_content && (
        <div className="mt-3 border border-gray-100 rounded-lg overflow-hidden">
          <div className="max-h-64 overflow-y-auto">
            <pre className="px-4 py-3 text-xs text-gray-700 font-mono whitespace-pre-wrap leading-relaxed">
              {contract.generated_content}
            </pre>
          </div>
        </div>
      )}

      {/* Confirm dialog */}
      {confirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
            <h3 className="font-semibold text-gray-900 mb-2">Confirmar firma</h3>
            <p className="text-sm text-gray-500 mb-1">
              Estás firmando el contrato de arrendamiento para:
            </p>
            <p className="text-sm font-medium text-gray-800 mb-1">
              {contract.properties?.name}{contract.rooms ? ` · Hab. ${contract.rooms.number}` : ""}
            </p>
            <p className="text-sm text-gray-500 mb-4">
              {formatCurrency(contract.monthly_rent)}/mes ·{" "}
              {formatDate(contract.start_date)}
              {contract.end_date ? ` → ${formatDate(contract.end_date)}` : ""}
            </p>
            <p className="text-xs text-gray-400 mb-5">
              Al confirmar, tu firma quedará registrada con la fecha y hora actuales.
              Esto es legalmente vinculante.
            </p>

            {error && (
              <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg mb-4">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={() => setConfirmOpen(false)}
                disabled={isPending}
                className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleSign}
                disabled={isPending}
                className="flex-1 px-3 py-2 text-sm bg-olive-600 text-white rounded-lg hover:bg-olive-700 disabled:opacity-50"
              >
                {isPending ? "Firmando..." : "Firmar contrato"}
              </button>
            </div>
          </div>
        </div>
      )}
    </li>
  );
}
