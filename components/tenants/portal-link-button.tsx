"use client";

import { useState } from "react";
import { Link2, Copy, Check, QrCode, X } from "lucide-react";

export default function PortalLinkButton({ tenantId }: { tenantId: string }) {
  const [copied, setCopied] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const portalUrl = `${window?.location?.origin ?? ""}/login`;

  async function handleCopy() {
    await navigator.clipboard.writeText(portalUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="flex items-center gap-1.5 px-3 py-2 text-sm border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
      >
        <Link2 className="w-4 h-4" />
        Portal inquilino
      </button>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="font-semibold text-gray-900">Portal del inquilino</h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Comparte este enlace con tu inquilino. Debe iniciar sesión con las credenciales que le has enviado.
                </p>
              </div>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 ml-2">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* URL box */}
            <div className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 mb-4">
              <p className="text-xs text-gray-500 break-all font-mono leading-relaxed">{portalUrl}</p>
            </div>

            {/* Copy button */}
            <button
              onClick={handleCopy}
              className={`w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-medium transition-colors ${
                copied
                  ? "bg-emerald-600 text-white"
                  : "bg-olive-600 text-white hover:bg-olive-700"
              }`}
            >
              {copied ? (
                <><Check className="w-4 h-4" /> Enlace copiado</>
              ) : (
                <><Copy className="w-4 h-4" /> Copiar enlace</>
              )}
            </button>

            <p className="text-xs text-gray-400 text-center mt-3">
              El inquilino inicia sesión con el email y contraseña de su cuenta.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
