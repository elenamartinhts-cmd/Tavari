"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { joinWithCode } from "@/app/actions/join-property";
import { KeyRound, ArrowRight, LogIn } from "lucide-react";

const inp = "w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-olive-500";

export default function TenantJoinPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loggedIn, setLoggedIn] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (authError) { setError(authError.message); return; }
    setUserEmail(data.user.email ?? email);

    // If already a tenant, redirect straight to portal
    const role = data.user.user_metadata?.role;
    const tenantId = data.user.user_metadata?.tenant_id;
    if (role === "tenant" && tenantId) {
      window.location.href = `/portal/${tenantId}`;
      return;
    }

    setLoggedIn(true);
  }

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    if (!loggedIn) return;
    setLoading(true);
    setError(null);
    const result = await joinWithCode(code);
    setLoading(false);
    if (result.error) { setError(result.error); return; }
    window.location.href = "/tenant/setup";
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-cream to-olive-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-md p-8">

        {/* Header */}
        <div className="mb-8 text-center">
          <div className="w-14 h-14 bg-olive-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <KeyRound className="w-7 h-7 text-olive-600" />
          </div>
          <h1 className="text-xl font-bold text-gray-900">Accede a tu habitación</h1>
          <p className="text-sm text-gray-500 mt-1">
            {loggedIn
              ? "Introduce el código que te ha dado tu arrendador."
              : "Inicia sesión con tu cuenta para continuar."}
          </p>
        </div>

        {!loggedIn ? (
          /* Step 1: Login */
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={inp} placeholder="tu@email.com" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
              <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className={inp} placeholder="••••••••" />
            </div>
            {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
            <button type="submit" disabled={loading} className="w-full flex items-center justify-center gap-2 bg-olive-600 text-white py-2.5 px-4 rounded-lg text-sm font-medium hover:bg-olive-700 transition-colors disabled:opacity-50">
              <LogIn className="w-4 h-4" />
              {loading ? "Verificando..." : "Iniciar sesión"}
            </button>
            <p className="text-center text-xs text-gray-400">
              ¿No tienes cuenta?{" "}
              <a href="/login" className="text-olive-600 hover:underline font-medium">Regístrate aquí</a>
              {" "}y vuelve a esta página.
            </p>
          </form>
        ) : (
          /* Step 2: Enter join code */
          <form onSubmit={handleJoin} className="space-y-4">
            <div className="bg-olive-50 border border-olive-100 rounded-lg px-4 py-3 mb-2">
              <p className="text-xs text-olive-700">Conectado como <span className="font-semibold">{userEmail}</span></p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Código de habitación</label>
              <input
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z2-9]/g, ""))}
                placeholder="Ej: A3BK29XZ"
                maxLength={8}
                required
                className="w-full px-3 py-3 border border-gray-300 rounded-lg text-lg font-mono tracking-[0.3em] text-center uppercase focus:outline-none focus:ring-2 focus:ring-olive-500"
              />
              <p className="text-xs text-gray-400 mt-1 text-center">8 caracteres · proporcionado por tu arrendador</p>
            </div>
            {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
            <button
              type="submit"
              disabled={loading || code.length < 8}
              className="w-full flex items-center justify-center gap-2 bg-olive-600 text-white py-2.5 px-4 rounded-lg text-sm font-medium hover:bg-olive-700 transition-colors disabled:opacity-50"
            >
              {loading ? "Verificando..." : <>Confirmar <ArrowRight className="w-4 h-4" /></>}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
