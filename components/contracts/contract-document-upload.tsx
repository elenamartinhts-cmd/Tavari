"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Upload, FileText, ExternalLink, Loader2, RefreshCw } from "lucide-react";
import {
  uploadContractDocument,
  getContractDocumentUrl,
} from "@/app/actions/contract-documents";

export default function ContractDocumentUpload({
  contractId,
  documentPath,
}: {
  contractId: string;
  documentPath: string | null;
}) {
  const [uploading, setUploading] = useState(false);
  const [viewLoading, setViewLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  async function handleFile(file: File) {
    setUploading(true);
    setError(null);
    const fd = new FormData();
    fd.append("file", file);
    const result = await uploadContractDocument(contractId, fd);
    setUploading(false);
    if (result.error) { setError(result.error); return; }
    router.refresh();
  }

  async function handleView() {
    if (!documentPath) return;
    setViewLoading(true);
    setError(null);
    const result = await getContractDocumentUrl(contractId, documentPath);
    setViewLoading(false);
    if (result.error) { setError(result.error); return; }
    window.open(result.url!, "_blank");
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png,.heic,.webp"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = "";
        }}
      />

      {documentPath ? (
        <div className="space-y-2">
          <button
            onClick={handleView}
            disabled={viewLoading}
            className="w-full flex items-center gap-2 px-3 py-2.5 bg-olive-50 border border-olive-200 text-olive-700 text-sm rounded-lg hover:bg-olive-100 transition-colors"
          >
            {viewLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <FileText className="w-4 h-4" />
            )}
            Ver documento
            <ExternalLink className="w-3.5 h-3.5 ml-auto opacity-60" />
          </button>
          <button
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="w-full flex items-center justify-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 py-1 transition-colors"
          >
            {uploading ? (
              <><Loader2 className="w-3 h-3 animate-spin" /> Subiendo...</>
            ) : (
              <><RefreshCw className="w-3 h-3" /> Reemplazar documento</>
            )}
          </button>
        </div>
      ) : (
        <button
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="w-full flex items-center justify-center gap-2 px-3 py-3 border-2 border-dashed border-gray-200 text-gray-400 text-sm rounded-lg hover:border-olive-400 hover:text-olive-600 transition-colors"
        >
          {uploading ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Subiendo...</>
          ) : (
            <><Upload className="w-4 h-4" /> Subir contrato</>
          )}
        </button>
      )}

      {error && <p className="text-xs text-red-600 mt-2">{error}</p>}
    </div>
  );
}
