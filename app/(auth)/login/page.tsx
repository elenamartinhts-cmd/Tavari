"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Mode = "login" | "signup" | "recover";

const inp = "w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-olive-500";

export default function LoginPage() {
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nombre, setNombre] = useState("");
  const [apellidos, setApellidos] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function switchMode(m: Mode) {
    setMode(m);
    setError(null);
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      const meta = data.user?.user_metadata;
      if (meta?.role === "tenant" && meta?.tenant_id) {
        window.location.href = `/portal/${meta.tenant_id}`;
      } else {
        window.location.href = "/dashboard";
      }
    }
  }

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    if (!nombre.trim() || !apellidos.trim()) {
      setError("El nombre y apellidos son obligatorios.");
      return;
    }
    if (!phone.trim()) {
      setError("El teléfono es obligatorio.");
      return;
    }
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        data: {
          full_name: `${nombre.trim()} ${apellidos.trim()}`,
          phone: phone.trim(),
        },
      },
    });
    if (error) {
      setError(error.message);
    } else {
      setError("Revisa tu email para confirmar el registro.");
    }
    setLoading(false);
  }

  async function handleRecover(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/update-password`,
    });
    if (error) {
      setError(error.message);
    } else {
      setError("Revisa tu email. Te hemos enviado un enlace para restablecer tu contraseña.");
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-cream to-olive-100 px-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Tavari</h1>
          <p className="mt-1 text-sm text-gray-500">El sistema operativo para arrendadores</p>
        </div>

        {mode === "recover" ? (
          <>
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Recuperar contraseña</h2>
              <p className="text-sm text-gray-500 mt-1">
                Introduce tu email y te enviamos un enlace para crear una nueva contraseña.
              </p>
            </div>
            <form onSubmit={handleRecover} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={inp} placeholder="tu@email.com" />
              </div>
              {error && (
                <p className={`text-sm px-3 py-2 rounded-lg ${error.includes("Revisa") ? "text-olive-700 bg-olive-50" : "text-red-600 bg-red-50"}`}>
                  {error}
                </p>
              )}
              <button type="submit" disabled={loading} className="w-full bg-olive-600 text-white py-2.5 px-4 rounded-lg text-sm font-medium hover:bg-olive-700 transition-colors disabled:opacity-50">
                {loading ? "Enviando..." : "Enviar enlace"}
              </button>
            </form>
            <button
              type="button"
              onClick={() => switchMode("login")}
              className="mt-4 w-full text-center text-sm text-gray-500 hover:text-gray-800 transition-colors"
            >
              Volver al inicio de sesión
            </button>
          </>
        ) : (
          <>
            {/* Tab switcher */}
            <div className="flex rounded-lg border border-gray-200 overflow-hidden mb-6">
              <button
                type="button"
                onClick={() => switchMode("login")}
                className={`flex-1 py-2 text-sm font-medium transition-colors ${
                  mode === "login" ? "bg-olive-600 text-white" : "text-gray-500 hover:bg-gray-50"
                }`}
              >
                Iniciar sesión
              </button>
              <button
                type="button"
                onClick={() => switchMode("signup")}
                className={`flex-1 py-2 text-sm font-medium transition-colors ${
                  mode === "signup" ? "bg-olive-600 text-white" : "text-gray-500 hover:bg-gray-50"
                }`}
              >
                Crear cuenta
              </button>
            </div>

            {mode === "login" ? (
              <>
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
                  <button type="submit" disabled={loading} className="w-full bg-olive-600 text-white py-2.5 px-4 rounded-lg text-sm font-medium hover:bg-olive-700 transition-colors disabled:opacity-50">
                    {loading ? "Entrando..." : "Entrar"}
                  </button>
                </form>
                <button
                  type="button"
                  onClick={() => switchMode("recover")}
                  className="mt-4 w-full text-center text-sm text-gray-400 hover:text-gray-700 transition-colors"
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </>
            ) : (
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
                    <input value={nombre} onChange={(e) => setNombre(e.target.value)} className={inp} placeholder="María" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Apellidos *</label>
                    <input value={apellidos} onChange={(e) => setApellidos(e.target.value)} className={inp} placeholder="García López" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono *</label>
                  <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className={inp} placeholder="+34 612 345 678" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                  <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={inp} placeholder="tu@email.com" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña *</label>
                  <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className={inp} placeholder="Mínimo 8 caracteres" />
                </div>
                {error && <p className={`text-sm px-3 py-2 rounded-lg ${error.includes("Revisa") ? "text-olive-700 bg-olive-50" : "text-red-600 bg-red-50"}`}>{error}</p>}
                <button type="submit" disabled={loading} className="w-full bg-olive-600 text-white py-2.5 px-4 rounded-lg text-sm font-medium hover:bg-olive-700 transition-colors disabled:opacity-50">
                  {loading ? "Creando cuenta..." : "Crear cuenta"}
                </button>
              </form>
            )}
          </>
        )}
      </div>
    </div>
  );
}
