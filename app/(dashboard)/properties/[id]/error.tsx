"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, ChevronLeft } from "lucide-react";

export default function PropertyError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Property page error:", error);
  }, [error]);

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <Link href="/properties" className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 mb-8 w-fit">
        <ChevronLeft className="w-4 h-4" />
        Propiedades
      </Link>
      <div className="bg-red-50 border border-red-200 rounded-xl p-6">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold text-red-800 mb-1">Error al cargar la propiedad</p>
            <p className="text-sm text-red-600 font-mono bg-red-100 rounded px-2 py-1 mt-2 break-all">
              {error.message}
            </p>
            {error.digest && (
              <p className="text-xs text-red-400 mt-1">Digest: {error.digest}</p>
            )}
          </div>
        </div>
        <button
          onClick={reset}
          className="mt-4 px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          Reintentar
        </button>
      </div>
    </div>
  );
}
