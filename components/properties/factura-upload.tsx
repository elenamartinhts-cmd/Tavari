"use client";

import { useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { Upload, X, FileText, Loader2, Link as LinkIcon } from "lucide-react";

const ACCEPT = ".pdf,.jpg,.jpeg,.png,.webp";
const inp = "w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-olive-500";

export default function FacturaUpload({
  value,
  onChange,
}: {
  value: string;
  onChange: (url: string) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadedName, setUploadedName] = useState<string | null>(null);
  const [showLink, setShowLink] = useState(!!(value && !value.includes("expense-docs")));
  const inputRef = useRef<HTMLInputElement>(null);

  const isStorageUrl = value.includes("expense-docs");

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadError(null);

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setUploadError("No autorizado"); setUploading(false); return; }

    const ext = file.name.split(".").pop() ?? "bin";
    const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    const { error } = await supabase.storage.from("expense-docs").upload(path, file);
    if (error) {
      setUploadError("Error al subir. Inténtalo de nuevo.");
      setUploading(false);
      return;
    }

    const { data: { publicUrl } } = supabase.storage.from("expense-docs").getPublicUrl(path);
    setUploadedName(file.name);
    onChange(publicUrl);
    setUploading(false);
    if (inputRef.current) inputRef.current.value = "";
  }

  function handleRemove() {
    setUploadedName(null);
    onChange("");
    setUploadError(null);
  }

  // File already uploaded to storage or just uploaded now
  if (isStorageUrl || (value && uploadedName)) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg bg-gray-50">
        <FileText className="w-4 h-4 text-olive-500 flex-shrink-0" />
        <span className="text-sm text-gray-700 flex-1 truncate">
          {uploadedName ?? "Documento adjunto"}
        </span>
        <a href={value} target="_blank" rel="noopener noreferrer" className="text-xs text-olive-600 hover:underline shrink-0">
          Ver
        </a>
        <button type="button" onClick={handleRemove} className="text-gray-400 hover:text-gray-600 shrink-0">
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  // External link mode
  if (showLink) {
    return (
      <div className="space-y-1.5">
        <div className="flex items-center gap-2">
          <input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Google Drive, Dropbox…"
            className={`${inp} flex-1`}
          />
          <button type="button" onClick={() => { onChange(""); setShowLink(false); }} className="text-gray-400 hover:text-gray-600">
            <X className="w-4 h-4" />
          </button>
        </div>
        <button type="button" onClick={() => setShowLink(false)} className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1">
          <Upload className="w-3 h-3" /> Subir archivo en su lugar
        </button>
      </div>
    );
  }

  // Upload mode (default)
  return (
    <div className="space-y-1.5">
      <label className={`flex items-center gap-2.5 px-3 py-2.5 border-2 border-dashed rounded-lg transition-colors cursor-pointer ${
        uploading ? "border-gray-200 opacity-60 cursor-wait" : "border-gray-200 hover:border-olive-400 hover:bg-olive-50/50"
      }`}>
        {uploading
          ? <Loader2 className="w-4 h-4 text-gray-400 animate-spin flex-shrink-0" />
          : <Upload className="w-4 h-4 text-gray-400 flex-shrink-0" />
        }
        <span className="text-sm text-gray-500">
          {uploading ? "Subiendo…" : "Subir factura o recibo (PDF, imagen)"}
        </span>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          onChange={handleFile}
          disabled={uploading}
          className="sr-only"
        />
      </label>
      {uploadError && <p className="text-xs text-red-500">{uploadError}</p>}
      <button type="button" onClick={() => setShowLink(true)} className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1">
        <LinkIcon className="w-3 h-3" /> Pegar enlace externo
      </button>
    </div>
  );
}
