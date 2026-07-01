"use client";

import { useState } from "react";
import { formatCurrency } from "@/lib/utils";
import type { Room, Tenant } from "@/lib/types";
import RoomStatusBadge from "./room-status-badge";
import { User, Maximize2, Wifi, Bath, Armchair, PenLine, Copy, Check } from "lucide-react";
import UpdateRoomStatusDialog from "./update-room-status-dialog";

const amenityIcons: Record<string, React.ReactNode> = {
  wifi: <Wifi className="w-3 h-3" />,
  ensuite: <Bath className="w-3 h-3" />,
  desk: <PenLine className="w-3 h-3" />,
  wardrobe: <Armchair className="w-3 h-3" />,
};

function CopyCodeButton({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  function copy() {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }
  return (
    <button
      onClick={copy}
      title="Copiar código"
      className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-olive-700 transition-colors group"
    >
      <span className="font-mono tracking-widest text-gray-700">{code}</span>
      {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 opacity-50 group-hover:opacity-100" />}
    </button>
  );
}

export default function RoomCard({ room, tenant }: { room: Room; tenant: Tenant | null }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-sm transition-shadow">
      {/* Card header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <div>
          <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Habitación</p>
          <p className="text-2xl font-bold text-gray-900 leading-none mt-0.5">{room.number}</p>
        </div>
        <RoomStatusBadge status={room.status} />
      </div>

      {/* Card body */}
      <div className="px-5 py-4 space-y-3">
        {/* Tenant */}
        <div className="flex items-center gap-2">
          <User className="w-4 h-4 text-gray-300 flex-shrink-0" />
          {tenant ? (
            <span className="text-sm text-gray-700 font-medium">{tenant.full_name}</span>
          ) : (
            <span className="text-sm text-gray-400 italic">Sin inquilino</span>
          )}
        </div>

        {/* Size */}
        {room.size_sqm && (
          <div className="flex items-center gap-2">
            <Maximize2 className="w-4 h-4 text-gray-300 flex-shrink-0" />
            <span className="text-sm text-gray-600">{room.size_sqm} m²</span>
          </div>
        )}

        {/* Amenities */}
        {room.amenities && room.amenities.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap">
            {room.amenities.map((a) => (
              <span key={a} className="inline-flex items-center gap-1 text-xs text-gray-500 bg-gray-50 px-2 py-0.5 rounded-full border border-gray-100">
                {amenityIcons[a] ?? null}
                {a}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Card footer */}
      <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-400">Renta mensual</p>
            <p className="text-sm font-bold text-gray-900">{formatCurrency(room.monthly_rent)}</p>
          </div>
          <UpdateRoomStatusDialog room={room} />
        </div>
        {room.join_code && !tenant && (
          <div className="flex items-center justify-between pt-1 border-t border-gray-100">
            <p className="text-xs text-gray-400">Código de acceso</p>
            <CopyCodeButton code={room.join_code} />
          </div>
        )}
      </div>
    </div>
  );
}
