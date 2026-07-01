"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

const inp = "w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-olive-500";

export default function UpdatePasswordPage() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const [checking, setChecking] = useState(true);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    const code = new URLSearchParams(window.location.search).get("code");

    async function establish() {
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          setError("Este enlace ya fue usado o ha caducado. Solicita uno nuevo desde la página de acceso.");
        } else {
          setReady(true);
        }
        setChecking(false);
        return;
      }

      // Implicit flow: Supabase fires PASSWORD_RECOVERY via onAuthStateChange
      // Also cover the case where the callback already set the session
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setReady(true);
        setChecking(false);
        return;
      }

      // Wait briefly for the PASSWORD_RECOVERY event from hash fragment
      const timeout = setTimeout(() => {
        setError("Este enlace ya fue usado o ha caducado. Solicita uno nuevo desde la página de acceso.");
        setChecking(false);
      }, 3000);

      const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
        if (event === "PASSWORD_RECOVERY") {
          clearTimeout(timeout);
          setReady(true);
          setChecking(false);
          subscription.unsubscribe();
        }
      });

      return () => { clearTimeout(timeout); subscription.unsubscribe(); };
    }

    establish();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }
    if (password !== confirm) {
      setError("Las contraseñas no coinciden.");
      return;
    }
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }
    await supabase.auth.signOut();
    setDone(true);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-cream to-olive-100 px-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Tavari</h1>
        </div>

        {done ? (
          <div className="text-center space-y-4">
            <div className="w-14 h-14 bg-emerald-50 rounded-full flex items-center justify-center mx-auto">
              <svg className="w-7 h-7 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">¡Contraseña actualizada!</h2>
              <p className="text-sm text-gray-500 mt-1">Ya puedes acceder con tu nueva contraseña.</p>
            </div>
            <a
              href="/login"
              className="inline-block w-full bg-olive-600 text-white py-2.5 px-4 rounded-lg text-sm font-medium hover:bg-olive-700 transition-colors text-center"
            >
              Ir al inicio de sesión
            </a>
          </div>
        ) : checking ? (
          <p className="text-sm text-gray-500 text-center">Verificando enlace...</p>
        ) : !ready ? (
          <div className="text-center space-y-4">
            <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
            <a href="/login" className="inline-block text-sm text-olive-600 hover:underline">
              Volver al inicio de sesión
            </a>
          </div>
        ) : (
          <>
            <h2 className="text-lg font-semibold text-gray-900 mb-1">Nueva contraseña</h2>
            <p className="text-sm text-gray-500 mb-6">Elige una contraseña segura para tu cuenta.</p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nueva contraseña</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={inp}
                  placeholder="Mínimo 8 caracteres"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirmar contraseña</label>
                <input
                  type="password"
                  required
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  className={inp}
                  placeholder="Repite la contraseña"
                />
              </div>
              {error && (
                <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
              )}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-olive-600 text-white py-2.5 px-4 rounded-lg text-sm font-medium hover:bg-olive-700 transition-colors disabled:opacity-50"
              >
                {loading ? "Guardando..." : "Guardar contraseña"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
