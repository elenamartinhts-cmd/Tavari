"use client";

import { useState, useTransition } from "react";
import { KeyRound, X, Eye, EyeOff } from "lucide-react";
import { setTenantPassword } from "@/app/actions/tenant-password";

const inp = "w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-olive-500";

export default function SetPasswordDialog({ tenantId, tenantName, hasAccount }: {
  tenantId: string;
  tenantName: string;
  hasAccount: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleOpen() {
    setPassword(""); setError(null); setDone(false); setOpen(true);
  }

  function handleSubmit() {
    setError(null);
    startTransition(async () => {
      const result = await setTenantPassword(tenantId, password);
      if (result.error) { setError(result.error); return; }
      setDone(true);
    });
  }

  return (
    <>
      <button
        onClick={handleOpen}
        disabled={!hasAccount}
        title={!hasAccount ? "El inquilino aún no tiene cuenta" : undefined}
        className="flex items-center gap-1.5 px-3 py-2 text-sm border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
      >
        <KeyRound className="w-3.5 h-3.5" />
        Contraseña
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
            <div className="px-6 pt-6 pb-4 border-b border-gray-100 flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-gray-900">Cambiar contraseña</h3>
                <p className="text-xs text-gray-400 mt-0.5">{tenantName}</p>
              </div>
              <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-6 py-5">
              {done ? (
                <div className="space-y-4">
                  <p className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-lg px-4 py-3">
                    Contraseña actualizada correctamente.
                  </p>
                  <button onClick={() => setOpen(false)} className="w-full py-2 text-sm border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50">
                    Cerrar
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Nueva contraseña</label>
                    <div className="relative">
                      <input
                        type={show ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Mínimo 8 caracteres"
                        className={`${inp} pr-10`}
                      />
                      <button
                        type="button"
                        onClick={() => setShow((s) => !s)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
                  <div className="flex gap-2 pt-1">
                    <button onClick={() => setOpen(false)} className="px-4 py-2 text-sm border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50">
                      Cancelar
                    </button>
                    <button
                      onClick={handleSubmit}
                      disabled={isPending || password.length < 8}
                      className="flex-1 py-2 text-sm bg-olive-600 text-white rounded-lg hover:bg-olive-700 disabled:opacity-50 font-medium"
                    >
                      {isPending ? "Guardando…" : "Guardar"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
