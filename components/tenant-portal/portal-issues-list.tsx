import { formatDate } from "@/lib/utils";
import IssueStatusBadge from "@/components/maintenance/issue-status-badge";
import IssuePriorityBadge from "@/components/maintenance/issue-priority-badge";
import type { IssueStatus, IssuePriority } from "@/lib/types";

const CATEGORY_LABELS: Record<string, string> = {
  plumbing: "Fontanería",
  electricity: "Electricidad",
  heating: "Calefacción",
  internet: "Internet",
  appliances: "Electrodomésticos",
  locks: "Cerraduras",
  cleaning: "Limpieza",
  pest_control: "Plagas",
  water_leak: "Fuga de agua",
  other: "Otro",
};

type Issue = {
  id: string;
  title: string;
  category: string;
  priority: IssuePriority;
  status: IssueStatus;
  created_at: string;
};

export default function PortalIssuesList({
  issues,
  title,
  muted = false,
}: {
  issues: Issue[];
  title: string;
  muted?: boolean;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100">
        <h2 className="font-semibold text-gray-900 text-sm">{title}</h2>
      </div>
      <ul className="divide-y divide-gray-50">
        {issues.map((issue) => (
          <li
            key={issue.id}
            className={`px-5 py-4 ${muted ? "opacity-60" : ""}`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{issue.title}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {CATEGORY_LABELS[issue.category] ?? issue.category}
                  {" · "}
                  {formatDate(issue.created_at)}
                </p>
              </div>
              <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                <IssueStatusBadge status={issue.status} />
                <IssuePriorityBadge priority={issue.priority} />
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
