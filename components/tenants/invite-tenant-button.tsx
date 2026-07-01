"use client";

import { useState, useTransition } from "react";
import { Mail, Send, Check, RefreshCw, AlertCircle } from "lucide-react";
import { inviteTenant } from "@/app/actions/tenant-invite";
import { formatDate } from "@/lib/utils";

interface Props {
  tenantId: string;
  inviteSentAt: string | null;
}

export default function InviteTenantButton({ tenantId, inviteSentAt }: Props) {
  const [sent, setSent] = useState(false);
  const [alreadyExists, setAlreadyExists] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleInvite() {
    startTransition(async () => {
      const result = await inviteTenant(tenantId);
      if (result.alreadyExists) {
        setAlreadyExists(true);
      } else if (result.error) {
        setError(result.error);
      } else {
        setSent(true);
      }
    });
  }

  if (sent) {
    return (
      <div className="flex items-center gap-1.5 px-3 py-2 text-sm text-emerald-600 bg-emerald-50 rounded-lg">
        <Check className="w-4 h-4" />
        Invitación enviada
      </div>
    );
  }

  if (alreadyExists) {
    return (
      <div className="flex flex-col items-end gap-1 max-w-xs">
        <div className="flex items-center gap-1.5 px-3 py-2 text-sm text-amber-700 bg-amber-50 rounded-lg border border-amber-200">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>Ya tiene cuenta</span>
        </div>
        <p className="text-xs text-gray-500 text-right leading-snug">
          Dile que vaya a la app y use{" "}
          <span className="font-medium text-gray-700">¿Olvidaste tu contraseña?</span>{" "}
          para acceder a su portal.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={handleInvite}
        disabled={isPending}
        className="flex items-center gap-1.5 px-3 py-2 text-sm bg-olive-600 text-white rounded-lg hover:bg-olive-700 transition-colors disabled:opacity-50"
      >
        {isPending ? (
          <><RefreshCw className="w-4 h-4 animate-spin" /> Enviando...</>
        ) : inviteSentAt ? (
          <><Send className="w-4 h-4" /> Reenviar invitación</>
        ) : (
          <><Mail className="w-4 h-4" /> Invitar al portal</>
        )}
      </button>
      {inviteSentAt && (
        <span className="text-xs text-gray-400">
          Enviado el {formatDate(inviteSentAt)}
        </span>
      )}
      {error && <span className="text-xs text-red-500">{error}</span>}
    </div>
  );
}
