import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, MapPin, DoorOpen, User, Clock, Tag } from "lucide-react";
import { formatDate } from "@/lib/utils";
import type { MaintenanceIssue, Property, Room, Tenant } from "@/lib/types";
import IssueStatusBadge from "@/components/maintenance/issue-status-badge";
import IssuePriorityBadge from "@/components/maintenance/issue-priority-badge";
import UpdateIssueDialog from "@/components/maintenance/update-issue-dialog";
import { MAINTENANCE_CATEGORY_LABELS, ISSUE_STATUS_FLOW } from "@/lib/maintenance";

type IssueDetail = MaintenanceIssue & {
  properties: Property;
  rooms: (Room & { tenants: Tenant[] }) | null;
  tenants: Tenant | null;
};

async function getIssue(id: string, landlordId: string): Promise<IssueDetail | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("maintenance_issues")
    .select("*, properties!inner(*, landlord_id), rooms(*, tenants(*)), tenants(*)")
    .eq("id", id)
    .eq("properties.landlord_id", landlordId)
    .single();
  return data as IssueDetail | null;
}

export default async function IssueDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const issue = await getIssue(id, user.id);
  if (!issue) notFound();

  const statusIndex = ISSUE_STATUS_FLOW.findIndex((s) => s.key === issue.status);
  const isClosed = issue.status === "closed" || issue.status === "resolved";
  const activeTenant = issue.tenants ?? issue.rooms?.tenants?.find((t) => t.is_active) ?? null;

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <Link href="/maintenance" className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 mb-6 w-fit">
        <ChevronLeft className="w-4 h-4" />
        Mantenimiento
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex-1 min-w-0 pr-4">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <IssuePriorityBadge priority={issue.priority} />
            <IssueStatusBadge status={issue.status} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">{issue.title}</h1>
          <p className="text-gray-500 mt-0.5 text-sm">
            {MAINTENANCE_CATEGORY_LABELS[issue.category] ?? issue.category}
            {" · "}Abierta el {formatDate(issue.created_at)}
          </p>
        </div>
        {!isClosed && <UpdateIssueDialog issue={issue} />}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-5">
          {/* Description */}
          {issue.description && (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Descripción</h3>
              <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{issue.description}</p>
            </div>
          )}

          {/* Progress timeline */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Progreso</h3>
            <div className="relative">
              {/* Vertical line */}
              <div className="absolute left-[11px] top-3 bottom-3 w-0.5 bg-gray-100" />
              <ol className="space-y-4">
                {ISSUE_STATUS_FLOW.map((step, i) => {
                  const done = i <= statusIndex;
                  const active = i === statusIndex;
                  return (
                    <li key={step.key} className="relative flex items-center gap-3">
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 z-10 transition-colors
                          ${active ? "bg-olive-600 ring-4 ring-olive-100" : done ? "bg-emerald-500" : "bg-gray-200"}`}
                      >
                        {done && !active && (
                          <svg className="w-3 h-3 text-white" viewBox="0 0 12 12" fill="none">
                            <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                        {active && <span className="w-2 h-2 bg-white rounded-full" />}
                      </div>
                      <span className={`text-sm ${active ? "font-semibold text-olive-700" : done ? "text-emerald-700" : "text-gray-400"}`}>
                        {step.label}
                      </span>
                    </li>
                  );
                })}
              </ol>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-5">
          {/* Location */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Ubicación</h3>
            <div className="space-y-2.5">
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-gray-300 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-400">Propiedad</p>
                  <Link
                    href={`/properties/${issue.properties.id}`}
                    className="text-sm font-medium text-olive-600 hover:underline"
                  >
                    {issue.properties.name}
                  </Link>
                  <p className="text-xs text-gray-500">{issue.properties.address}</p>
                </div>
              </div>
              {issue.rooms && (
                <div className="flex items-center gap-2.5">
                  <DoorOpen className="w-4 h-4 text-gray-300 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-400">Habitación</p>
                    <p className="text-sm font-medium text-gray-800">Hab. {issue.rooms.number}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Reported by */}
          {activeTenant && (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Inquilino</h3>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-olive-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-semibold text-olive-700">
                    {activeTenant.full_name.charAt(0)}
                  </span>
                </div>
                <div>
                  <Link href={`/tenants/${activeTenant.id}`} className="text-sm font-medium text-olive-600 hover:underline">
                    {activeTenant.full_name}
                  </Link>
                  <p className="text-xs text-gray-400">{activeTenant.email}</p>
                </div>
              </div>
            </div>
          )}

          {/* Meta */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Detalles</h3>
            <div className="space-y-2.5">
              <div className="flex items-center gap-2.5">
                <Tag className="w-4 h-4 text-gray-300" />
                <div>
                  <p className="text-xs text-gray-400">Categoría</p>
                  <p className="text-sm text-gray-700">{MAINTENANCE_CATEGORY_LABELS[issue.category] ?? issue.category}</p>
                </div>
              </div>
              <div className="flex items-center gap-2.5">
                <Clock className="w-4 h-4 text-gray-300" />
                <div>
                  <p className="text-xs text-gray-400">Creada</p>
                  <p className="text-sm text-gray-700">{formatDate(issue.created_at)}</p>
                </div>
              </div>
              {issue.updated_at !== issue.created_at && (
                <div className="flex items-center gap-2.5">
                  <Clock className="w-4 h-4 text-gray-300" />
                  <div>
                    <p className="text-xs text-gray-400">Actualizada</p>
                    <p className="text-sm text-gray-700">{formatDate(issue.updated_at)}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
