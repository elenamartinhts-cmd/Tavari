"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard, CreditCard, FileText, Wrench, User, LogOut,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

interface Props {
  tenantId: string;
  tenantName: string;
  tenantEmail: string;
}

const navItems = [
  { href: "#inicio",      icon: LayoutDashboard, label: "Inicio" },
  { href: "#pagos",       icon: CreditCard,      label: "Pagos" },
  { href: "#contratos",   icon: FileText,         label: "Contratos" },
  { href: "#incidencias", icon: Wrench,           label: "Incidencias" },
  { href: "#mis-datos",   icon: User,             label: "Mis datos" },
];

export default function PortalSidebar({ tenantId, tenantName, tenantEmail }: Props) {
  const router = useRouter();
  const [activeHash, setActiveHash] = useState("#inicio");

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  const displayLetter = (tenantName || tenantEmail).charAt(0).toUpperCase();

  return (
    <aside className="w-60 bg-[#F2EDE3] border-r border-[#DDD6C8] flex flex-col flex-shrink-0">
      <div className="h-16 flex items-center px-6 border-b border-[#DDD6C8]">
        <span className="text-xl font-bold text-olive-700 tracking-tight">Tavari</span>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {navItems.map(({ href, icon: Icon, label }) => (
          <a
            key={href}
            href={href}
            onClick={() => setActiveHash(href)}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
              activeHash === href
                ? "bg-olive-100 text-olive-800"
                : "text-stone-600 hover:bg-[#E8E1D4] hover:text-stone-900"
            )}
          >
            <Icon className="w-4 h-4 flex-shrink-0" />
            {label}
          </a>
        ))}
      </nav>

      <div className="p-3 border-t border-[#DDD6C8]">
        <div className="flex items-center gap-3 px-3 py-2 mb-1 rounded-lg">
          <div className="w-8 h-8 rounded-full bg-olive-100 flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-semibold text-olive-700">{displayLetter}</span>
          </div>
          <div className="min-w-0 flex-1">
            {tenantName ? (
              <>
                <p className="text-xs font-medium text-stone-700 truncate">{tenantName}</p>
                <p className="text-xs text-stone-400 truncate">{tenantEmail}</p>
              </>
            ) : (
              <p className="text-xs text-stone-500 truncate">{tenantEmail}</p>
            )}
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2 w-full rounded-lg text-sm font-medium text-stone-500 hover:bg-[#E8E1D4] hover:text-stone-900 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}
