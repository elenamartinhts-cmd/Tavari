"use client";

import { useState, useTransition } from "react";
import { Pen, AlertCircle } from "lucide-react";
import { signContractAsLandlord } from "@/app/contracts/actions";

export default function SignContractButton({ contractId }: { contractId: string }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSign() {
    setError(null);
    startTransition(async () => {
      const result = await signContractAsLandlord(contractId);
      if (result.error) {
        setError(result.error);
      } else {
        setOpen(false);
      }
    });
  }

  return (
    <>
      <button
        onClick={() => { setOpen(true); setError(null); }}
        className="flex items-center gap-1.5 text-xs font-medium text-olive-600 hover:text-olive-700 mt-1"
      >
        <Pen className="w-3.5 h-3.5" />
        Firmar como arrendador
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-white rounded-xl shadow-xl w-80 p-6">
            <h3 className="font-semibold text-gray-900 mb-2">Confirmar firma</h3>
            <p className="text-sm text-gray-500 mb-4">
              Se registrará tu firma como arrendador con la fecha y hora actuales.
              Después el inquilino recibirá el enlace para firmar.
            </p>

            {error && (
              <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg mb-4">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={() => setOpen(false)}
                disabled={isPending}
                className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleSign}
                disabled={isPending}
                className="flex-1 px-3 py-2 text-sm bg-olive-600 text-white rounded-lg hover:bg-olive-700 disabled:opacity-50"
              >
                {isPending ? "Firmando..." : "Confirmar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
