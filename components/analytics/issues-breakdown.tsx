import Link from "next/link";
import { AlertTriangle, Wrench } from "lucide-react";

type CategoryStat = { category: string; label: string; count: number };

const CATEGORY_COLORS: Record<string, string> = {
  plumbing: "bg-olive-400",
  electricity: "bg-yellow-400",
  heating: "bg-orange-400",
  internet: "bg-violet-400",
  appliances: "bg-gray-400",
  locks: "bg-slate-400",
  cleaning: "bg-green-400",
  pest_control: "bg-red-400",
  water_leak: "bg-cyan-400",
  other: "bg-gray-300",
};

export default function IssuesBreakdown({
  byCategory,
  total,
  urgent,
}: {
  byCategory: CategoryStat[];
  total: number;
  urgent: number;
}) {
  const maxCount = Math.max(...byCategory.map((c) => c.count), 1);

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
          Incidencias abiertas
        </h3>
        <Link href="/maintenance" className="text-xs text-olive-600 hover:underline font-medium">
          Ver todas
        </Link>
      </div>

      {total === 0 ? (
        <div className="text-center py-8">
          <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center mx-auto mb-2">
            <Wrench className="w-5 h-5 text-emerald-400" />
          </div>
          <p className="text-sm text-gray-400">Sin incidencias abiertas</p>
        </div>
      ) : (
        <>
          {/* Summary pills */}
          <div className="flex items-center gap-2 mb-5">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gray-100 rounded-full text-xs font-medium text-gray-600">
              <Wrench className="w-3 h-3" />
              {total} total
            </span>
            {urgent > 0 && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-red-100 rounded-full text-xs font-medium text-red-700">
                <AlertTriangle className="w-3 h-3" />
                {urgent} urgente{urgent !== 1 ? "s" : ""}
              </span>
            )}
          </div>

          {/* Horizontal bars */}
          <div className="space-y-3">
            {byCategory.map((item) => (
              <div key={item.category} className="flex items-center gap-3">
                <div className="w-24 flex-shrink-0">
                  <span className="text-xs text-gray-600 truncate block">{item.label}</span>
                </div>
                <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${CATEGORY_COLORS[item.category] ?? "bg-gray-400"}`}
                    style={{ width: `${(item.count / maxCount) * 100}%` }}
                  />
                </div>
                <span className="text-xs font-semibold text-gray-600 w-5 text-right flex-shrink-0">
                  {item.count}
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
