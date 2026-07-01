"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center">
      <div className="text-center max-w-sm">
        <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-8 h-8 text-red-400" />
        </div>
        <h1 className="text-xl font-bold text-gray-900 mb-1">Algo ha ido mal</h1>
        <p className="text-gray-500 text-sm mb-6">{error.message || "Ha ocurrido un error inesperado."}</p>
        <button
          onClick={reset}
          className="inline-flex items-center px-4 py-2 bg-olive-600 text-white text-sm font-medium rounded-lg hover:bg-olive-700 transition-colors"
        >
          Intentar de nuevo
        </button>
      </div>
    </div>
  );
}
