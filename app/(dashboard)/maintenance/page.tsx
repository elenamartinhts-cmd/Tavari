import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Wrench, ArrowRight, AlertTriangle } from "lucide-react";
import { formatDate } from "@/lib/utils";
import type { MaintenanceIssue, Property, Room } from "@/lib/types";
import AddIssueDialog from "@/components/maintenance/add-issue-dialog";
import IssueStatusBadge from "@/components/maintenance/issue-status-badge";
import IssuePriorityBadge from "@/components/maintenance/issue-priority-badge";
import { MAINTENANCE_CATEGORY_LABELS, MAINTENANCE_CATEGORY_COLORS } from "@/lib/maintenance";

type IssueRow = MaintenanceIssue & {
  properties: Pick<Property, "id" | "name">;
  rooms: Pick<Room, "number"> | null;
};

async function getIssues(landlordId: string): Promise<IssueRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("maintenance_issues")
    .select("*, properties!inner(id, name, landlord_id), rooms(number)")
    .eq("properties.landlord_id", landlordId)
    .order("created_at", { ascending: false });
  return (data ?? []) as IssueRow[];
}

async function getProperties(landlordId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("properties")
    .select("id, name, rooms(id, number, tenants(id, is_active))")
    .eq("landlord_id", landlordId)
    .order("name");
  // Flatten to the shape AddIssueDialog expects
  return (data ?? []).map((p: any) => ({
    id: p.id,
    name: p.name,
    rooms: (p.rooms ?? []).map((r: any) => ({
      id: r.id,
      number: r.number,
      activeTenantId: (r.tenants ?? []).find((t: any) => t.is_active)?.id ?? null,
    })),
  }));
}

export default async function MaintenancePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const [issues, properties] = await Promise.all([
    getIssues(user.id),
    getProperties(user.id),
  ]);

  const open = issues.filter((i) => i.status === "open" || i.status === "in_progress" || i.status === "waiting_tenant");
  const resolved = issues.filter((i) => i.status === "resolved" || i.status === "closed");
  const urgent = open.filter((i) => i.priority === "urgent");

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mantenimiento</h1>
          <p className="text-gray-500 mt-0.5">
            {open.length} activa{open.length !== 1 ? "s" : ""}
            {urgent.length > 0 && (
              <span className="ml-2 inline-flex items-center gap-1 text-red-600 font-medium text-xs">
                <AlertTriangle className="w-3 h-3" />
                {urgent.length} urgente{urgent.length !== 1 ? "s" : ""}
              </span>
            )}
          </p>
        </div>
        <AddIssueDialog properties={properties as any} />
      </div>

      {issues.length === 0 ? (
        <EmptyState properties={properties as any} />
      ) : (
        <div className="space-y-8">
          {open.length > 0 && (
            <section>
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                Activas · {open.length}
              </h2>
              <IssueTable issues={open} />
            </section>
          )}
          {resolved.length > 0 && (
            <section>
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                Resueltas / Cerradas · {resolved.length}
              </h2>
              <IssueTable issues={resolved} muted />
            </section>
          )}
        </div>
      )}
    </div>
  );
}

function IssueTable({ issues, muted = false }: { issues: IssueRow[]; muted?: boolean }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100">
            <th className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Incidencia</th>
            <th className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide hidden md:table-cell">Propiedad</th>
            <th className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Prioridad</th>
            <th className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Estado</th>
            <th className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide hidden lg:table-cell">Fecha</th>
            <th className="px-6 py-3" />
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {issues.map((issue) => (
            <tr key={issue.id} className={`hover:bg-gray-50/50 transition-colors ${muted ? "opacity-60" : ""}`}>
              <td className="px-6 py-4">
                <div className="flex items-center gap-2.5">
                  <CategoryDot category={issue.category} />
                  <div>
                    <p className="font-medium text-gray-900 leading-snug">{issue.title}</p>
                    <p className="text-xs text-gray-400 capitalize">{MAINTENANCE_CATEGORY_LABELS[issue.category] ?? issue.category}</p>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 hidden md:table-cell">
                <p className="text-gray-700">{issue.properties.name}</p>
                {issue.rooms && <p className="text-xs text-gray-400">Hab. {issue.rooms.number}</p>}
              </td>
              <td className="px-6 py-4">
                <IssuePriorityBadge priority={issue.priority} />
              </td>
              <td className="px-6 py-4">
                <IssueStatusBadge status={issue.status} />
              </td>
              <td className="px-6 py-4 hidden lg:table-cell text-gray-400 text-xs">
                {formatDate(issue.created_at)}
              </td>
              <td className="px-6 py-4 text-right">
                <Link
                  href={`/maintenance/${issue.id}`}
                  className="inline-flex items-center gap-1 text-xs text-olive-600 hover:underline font-medium"
                >
                  Ver <ArrowRight className="w-3 h-3" />
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CategoryDot({ category }: { category: string }) {
  return (
    <span
      className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${MAINTENANCE_CATEGORY_COLORS[category] ?? "bg-gray-300"}`}
    />
  );
}

function EmptyState({ properties }: { properties: any[] }) {
  return (
    <div className="text-center py-20">
      <div className="w-16 h-16 bg-olive-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
        <Wrench className="w-8 h-8 text-olive-400" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-1">Sin incidencias</h3>
      <p className="text-gray-500 text-sm mb-6">Registra una incidencia para hacer seguimiento.</p>
      <AddIssueDialog properties={properties} />
    </div>
  );
}
