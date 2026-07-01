"use client";

import { useState } from "react";
import { FileText, ChevronDown, ChevronUp, Download } from "lucide-react";

export default function ContractContentViewer({
  content,
  contractId,
  tenantName,
}: {
  content: string;
  contractId: string;
  tenantName: string;
}) {
  const [expanded, setExpanded] = useState(false);

  function handleDownload() {
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `contrato-${tenantName.replace(/\s+/g, "-").toLowerCase()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-gray-400" />
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Contenido del contrato</h3>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleDownload}
            className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-olive-600 font-medium px-2 py-1 rounded hover:bg-gray-50"
          >
            <Download className="w-3.5 h-3.5" />
            Descargar
          </button>
          <button
            onClick={() => setExpanded((v) => !v)}
            className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-900 font-medium px-2 py-1 rounded hover:bg-gray-50"
          >
            {expanded ? (
              <><ChevronUp className="w-3.5 h-3.5" /> Colapsar</>
            ) : (
              <><ChevronDown className="w-3.5 h-3.5" /> Expandir</>
            )}
          </button>
        </div>
      </div>

      <div
        className={`overflow-hidden transition-all duration-200 ${expanded ? "max-h-[9999px]" : "max-h-48"}`}
      >
        <pre className="px-5 py-4 text-xs text-gray-700 leading-relaxed font-mono whitespace-pre-wrap break-words">
          {content}
        </pre>
      </div>

      {!expanded && (
        <div className="relative h-8 -mt-8 bg-gradient-to-t from-white to-transparent pointer-events-none" />
      )}
    </div>
  );
}
