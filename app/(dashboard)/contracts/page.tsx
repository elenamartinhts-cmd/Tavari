import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { FileText, ArrowRight, AlertTriangle, Plus } from "lucide-react";
import { formatDate, formatCurrency } from "@/lib/utils";
import type { Contract, Tenant, Room, Property } from "@/lib/types";
import ContractStatusBadge from "@/components/contracts/contract-status-badge";
import NewContractDialog from "@/components/contracts/new-contract-dialog";
import ManageTemplatesDialog from "@/components/contracts/manage-templates-dialog";
import { differenceInDays } from "date-fns";
import { computeContractStatus } from "@/lib/contracts";

type ContractRow = Contract & {
  tenants: Pick<Tenant, "id" | "full_name" | "email">;
  rooms: Pick<Room, "number"> | null;
  properties: Pick<Property, "id" | "name"> | null;
};

async function getContracts(landlordId: string): Promise<ContractRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("contracts")
    .select("*, tenants(id, full_name, email), rooms(number), properties(id, name)")
    .eq("landlord_id", landlordId)
    .order("created_at", { ascending: false });
  return (data ?? []) as ContractRow[];
}

async function getTemplates(landlordId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("contract_templates")
    .select("id, name, created_at, updated_at")
    .eq("landlord_id", landlordId)
    .order("name");
  return data ?? [];
}

async function getActiveTenants(landlordId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("tenants")
    .select("id, full_name, email, phone, id_number, rooms(id, number, monthly_rent, deposit_amount, properties(id, name, address, city, postal_code))")
    .eq("landlord_id", landlordId)
    .eq("is_active", true);
  return data ?? [];
}

export default async function ContractsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const [contracts, templates, activeTenants] = await Promise.all([
    getContracts(user.id),
    getTemplates(user.id),
    getActiveTenants(user.id),
  ]);

  const enriched = contracts.map((c) => ({ ...c, status: computeContractStatus(c) }));
  const active = enriched.filter((c) => c.status === "active" || c.status === "expiring" || c.status === "pending_signature");
  const archived = enriched.filter((c) => c.status === "expired" || c.status === "terminated" || c.status === "draft");
  const expiring = enriched.filter((c) => c.status === "expiring");

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Contratos</h1>
          <p className="text-gray-500 mt-0.5">
            {active.length} activo{active.length !== 1 ? "s" : ""}
            {expiring.length > 0 && (
              <span className="ml-2 inline-flex items-center gap-1 text-amber-600 font-medium text-xs">
                <AlertTriangle className="w-3 h-3" />
                {expiring.length} vence pronto
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ManageTemplatesDialog templates={templates as any} />
          <NewContractDialog
            activeTenants={activeTenants as any}
            templates={templates as any}
          />
        </div>
      </div>

      {contracts.length === 0 ? (
        <EmptyState activeTenants={activeTenants as any} templates={templates as any} />
      ) : (
        <div className="space-y-8">
          {active.length > 0 && (
            <section>
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                Activos · {active.length}
              </h2>
              <ContractTable contracts={active} />
            </section>
          )}
          {archived.length > 0 && (
            <section>
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                Archivados · {archived.length}
              </h2>
              <ContractTable contracts={archived} muted />
            </section>
          )}
        </div>
      )}
    </div>
  );
}

function ContractTable({ contracts, muted = false }: { contracts: ContractRow[]; muted?: boolean }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100">
            <th className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Inquilino</th>
            <th className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide hidden md:table-cell">Propiedad</th>
            <th className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide hidden lg:table-cell">Renta</th>
            <th className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide hidden lg:table-cell">Inicio</th>
            <th className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Fin</th>
            <th className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Estado</th>
            <th className="px-6 py-3" />
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {contracts.map((contract) => (
            <ContractRow key={contract.id} contract={contract} muted={muted} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ContractRow({ contract, muted }: { contract: ContractRow; muted: boolean }) {
  const daysLeft = contract.end_date
    ? differenceInDays(new Date(contract.end_date), new Date())
    : null;

  return (
    <tr className={`hover:bg-gray-50/50 transition-colors ${muted ? "opacity-60" : ""}`}>
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-olive-100 flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-semibold text-olive-700">
              {contract.tenants.full_name.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <Link href={`/tenants/${contract.tenants.id}`} className="font-medium text-gray-900 hover:text-olive-600">
              {contract.tenants.full_name}
            </Link>
            <p className="text-xs text-gray-400">{contract.tenants.email}</p>
          </div>
        </div>
      </td>
      <td className="px-6 py-4 hidden md:table-cell">
        {contract.properties ? (
          <div>
            <p className="text-gray-700">{contract.properties.name}</p>
            {contract.rooms && <p className="text-xs text-gray-400">Hab. {contract.rooms.number}</p>}
          </div>
        ) : (
          <span className="text-gray-400">—</span>
        )}
      </td>
      <td className="px-6 py-4 hidden lg:table-cell font-medium text-gray-700">
        {formatCurrency(contract.monthly_rent)}/mes
      </td>
      <td className="px-6 py-4 hidden lg:table-cell text-gray-600">
        {formatDate(contract.start_date)}
      </td>
      <td className="px-6 py-4">
        {contract.end_date ? (
          <div>
            <p className="text-gray-600">{formatDate(contract.end_date)}</p>
            {daysLeft !== null && daysLeft >= 0 && daysLeft <= 30 && (
              <p className="text-xs text-amber-600 font-medium">{daysLeft}d restantes</p>
            )}
          </div>
        ) : (
          <span className="text-gray-400 text-xs italic">Indefinido</span>
        )}
      </td>
      <td className="px-6 py-4">
        <ContractStatusBadge status={contract.status} />
      </td>
      <td className="px-6 py-4 text-right">
        <Link
          href={`/contracts/${contract.id}`}
          className="inline-flex items-center gap-1 text-xs text-olive-600 hover:underline font-medium"
        >
          Ver <ArrowRight className="w-3 h-3" />
        </Link>
      </td>
    </tr>
  );
}

function EmptyState({ activeTenants, templates }: { activeTenants: any[]; templates: any[] }) {
  return (
    <div className="text-center py-20">
      <div className="w-16 h-16 bg-olive-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
        <FileText className="w-8 h-8 text-olive-400" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-1">Sin contratos aún</h3>
      <p className="text-gray-500 text-sm mb-6">Crea una plantilla y genera tu primer contrato.</p>
      <div className="flex items-center justify-center gap-2">
        <ManageTemplatesDialog templates={templates} />
        <NewContractDialog activeTenants={activeTenants} templates={templates} />
      </div>
    </div>
  );
}
