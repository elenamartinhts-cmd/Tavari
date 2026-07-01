"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { SlidersHorizontal } from "lucide-react";
import type { MaintenanceIssue, IssueStatus, IssuePriority } from "@/lib/types";
import { ISSUE_STATUS_FLOW, ISSUE_PRIORITIES } from "@/lib/maintenance";

const STATUSES: { value: IssueStatus; label: string }[] = ISSUE_STATUS_FLOW.map((s) => ({ value: s.key, label: s.label }));
const PRIORITIES = ISSUE_PRIORITIES;

export default function UpdateIssueDialog({ issue }: { issue: MaintenanceIssue }) {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<IssueStatus>(issue.status);
  const [priority, setPriority] = useState<IssuePriority>(issue.priority);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleSave() {
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { error: updateError } = await supabase
      .from("maintenance_issues")
      .update({ status, priority })
      .eq("id", issue.id);
    setLoading(false);
    if (updateError) { setError(updateError.message); return; }
    setOpen(false);
    router.refresh();
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-4 py-2 bg-olive-600 text-white text-sm font-medium rounded-lg hover:bg-olive-700 transition-colors"
      >
        <SlidersHorizontal className="w-4 h-4" />
        Actualizar
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-white rounded-xl shadow-xl w-80 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Actualizar incidencia</h3>

            <div className="mb-4">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Estado</p>
              <div className="space-y-1.5">
                {STATUSES.map(({ value, label }) => (
                  <label key={value} className="flex items-center gap-2.5 cursor-pointer group">
                    <input
                      type="radio"
                      name="status"
                      value={value}
                      checked={status === value}
                      onChange={() => setStatus(value)}
                      className="text-olive-600"
                    />
                    <span className="text-sm text-gray-700 group-hover:text-gray-900">{label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Prioridad</p>
              <div className="space-y-1.5">
                {PRIORITIES.map(({ value, label }) => (
                  <label key={value} className="flex items-center gap-2.5 cursor-pointer group">
                    <input
                      type="radio"
                      name="priority"
                      value={value}
                      checked={priority === value}
                      onChange={() => setPriority(value)}
                      className="text-olive-600"
                    />
                    <span className="text-sm text-gray-700 group-hover:text-gray-900">{label}</span>
                  </label>
                ))}
              </div>
            </div>

            {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg mb-4">{error}</p>}

            <div className="flex gap-2">
              <button
                onClick={() => setOpen(false)}
                className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={loading}
                className="flex-1 px-3 py-2 text-sm bg-olive-600 text-white rounded-lg hover:bg-olive-700 disabled:opacity-50"
              >
                {loading ? "Guardando..." : "Guardar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
