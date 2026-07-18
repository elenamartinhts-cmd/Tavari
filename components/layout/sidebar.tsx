"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  Users,
  CreditCard,
  Wrench,
  BarChart3,
  LogOut,
  FileText,
  Pencil,
  X,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Panel" },
  { href: "/properties", icon: Building2, label: "Propiedades" },
  { href: "/tenants", icon: Users, label: "Inquilinos" },
  { href: "/payments", icon: CreditCard, label: "Pagos" },
  { href: "/maintenance", icon: Wrench, label: "Mantenimiento" },
  { href: "/contracts", icon: FileText, label: "Contratos" },
  { href: "/analytics", icon: BarChart3, label: "Análisis" },
];

const inp = "w-full px-2.5 py-1.5 border border-gray-300 rounded-md text-xs focus:outline-none focus:ring-2 focus:ring-olive-500";

export default function Sidebar({ userName, userEmail, userPhone }: { userName: string; userEmail: string; userPhone: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [editName, setEditName] = useState(userName);
  const [editPhone, setEditPhone] = useState(userPhone);
  const [saving, setSaving] = useState(false);
  const [currentName, setCurrentName] = useState(userName);
  const [currentPhone, setCurrentPhone] = useState(userPhone);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  async function handleSaveProfile() {
    if (!editName.trim()) return;
    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({
      data: {
        full_name: editName.trim(),
        phone: editPhone.trim(),
      },
    });
    setSaving(false);
    if (error) return;
    setCurrentName(editName.trim());
    setCurrentPhone(editPhone.trim());
    setEditOpen(false);
    router.refresh();
  }

  const displayLetter = (currentName || userEmail).charAt(0).toUpperCase();

  return (
    <aside className="w-60 bg-olive-800 border-r border-olive-900 flex flex-col">
      <div className="h-16 flex items-center px-6 border-b border-white/10">
        <svg viewBox="0 0 95 37" width="88" height="34" xmlns="http://www.w3.org/2000/svg">
          <text
            x="0" y="19"
            textAnchor="start"
            fill="white"
            fontFamily="Georgia, 'Times New Roman', serif"
            fontSize="15"
            letterSpacing="5"
            fontWeight="400"
          >TAVARI</text>
          <line x1="0"  y1="30" x2="31" y2="30" stroke="white" strokeWidth="0.75" strokeOpacity="0.45" />
          <polygon points="38,26.5 41.5,30 38,33.5 34.5,30" fill="white" fillOpacity="0.45" />
          <line x1="45" y1="30" x2="76" y2="30" stroke="white" strokeWidth="0.75" strokeOpacity="0.45" />
        </svg>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {navItems.map(({ href, icon: Icon, label }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
              pathname === href || pathname.startsWith(href + "/")
                ? "bg-white/10 text-white"
                : "text-white/60 hover:bg-white/10 hover:text-white"
            )}
          >
            <Icon className="w-4 h-4 flex-shrink-0" />
            {label}
          </Link>
        ))}
      </nav>

      <div className="p-3 border-t border-white/10">
        {/* Profile edit panel */}
        {editOpen && (
          <div className="mb-2 bg-white rounded-xl border border-gray-200 p-3 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-gray-700">Editar perfil</p>
              <button onClick={() => setEditOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="space-y-2">
              <div>
                <label className="block text-xs text-gray-500 mb-0.5">Nombre completo</label>
                <input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className={inp}
                  placeholder="María García López"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-0.5">Teléfono</label>
                <input
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className={inp}
                  placeholder="+34 612 345 678"
                />
              </div>
            </div>
            <button
              onClick={handleSaveProfile}
              disabled={saving || !editName.trim()}
              className="mt-3 w-full flex items-center justify-center gap-1.5 py-1.5 bg-olive-600 text-white text-xs font-medium rounded-md hover:bg-olive-700 disabled:opacity-50 transition-colors"
            >
              <Check className="w-3 h-3" />
              {saving ? "Guardando..." : "Guardar"}
            </button>
          </div>
        )}

        {/* User row */}
        <div
          className="flex items-center gap-3 px-3 py-2 mb-1 rounded-lg group cursor-pointer hover:bg-white/10 transition-colors"
          onClick={() => { setEditName(currentName); setEditPhone(currentPhone); setEditOpen((v) => !v); }}
        >
          <div className="w-8 h-8 rounded-full bg-olive-600 flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-semibold text-white">{displayLetter}</span>
          </div>
          <div className="min-w-0 flex-1">
            {currentName ? (
              <>
                <p className="text-xs font-medium text-white truncate">{currentName}</p>
                <p className="text-xs text-white/40 truncate">{currentPhone || userEmail}</p>
              </>
            ) : (
              <p className="text-xs text-white/60 truncate">{userEmail}</p>
            )}
          </div>
          <Pencil className="w-3 h-3 text-white/40 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
        </div>

        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2 w-full rounded-lg text-sm font-medium text-white/50 hover:bg-white/10 hover:text-white transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}
