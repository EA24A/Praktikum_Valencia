"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import Image from "next/image";
import { Loader2, Lock } from "lucide-react";

type Props = { logoUrl?: string };

export default function LoginForm({ logoUrl }: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const logoSrc = logoUrl ?? "/logo.png";

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await signIn("credentials", {
        email,
        password,
        redirect: false,
        callbackUrl: "/admin",
      });

      if (res?.error) {
        setError("Email o contraseña incorrectos");
        return;
      }

      if (res?.ok) {
        // Full navigation ensures the session cookie is sent on the next request.
        window.location.assign("/admin");
        return;
      }

      setError("No se pudo iniciar sesión. Inténtalo de nuevo.");
    } catch {
      setError("Error de conexión. Comprueba tu red e inténtalo de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-20 h-20 rounded-full overflow-hidden mx-auto mb-4 ring-2 ring-[var(--gold)]/40 bg-black">
            <Image
              src={logoSrc}
              alt="Casa Fenicia"
              width={160}
              height={160}
              className="w-full h-full object-contain"
              unoptimized={logoSrc.startsWith("/")}
            />
          </div>
          <h1 className="font-display text-3xl text-white">Casa Fenicia</h1>
          <p className="font-body text-sm text-[var(--sand)]/60 mt-1">Panel de administración</p>
        </div>

        <form
          onSubmit={onSubmit}
          className="bg-[var(--warm-white)] rounded-2xl p-8 space-y-4 shadow-2xl"
        >
          <div>
            <label className="block font-body text-sm text-[var(--espresso-light)] mb-1.5">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-[var(--cream)] border border-[var(--border)] rounded-lg px-4 py-3 font-body text-sm text-[var(--espresso)] focus:outline-none focus:border-[var(--terracotta)] transition-colors"
              placeholder="admin@casafenicia.com"
              required
            />
          </div>

          <div>
            <label className="block font-body text-sm text-[var(--espresso-light)] mb-1.5">
              Contraseña
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[var(--cream)] border border-[var(--border)] rounded-lg px-4 py-3 font-body text-sm text-[var(--espresso)] focus:outline-none focus:border-[var(--terracotta)] transition-colors"
              placeholder="••••••••"
              required
            />
          </div>

          {error && (
            <p className="font-body text-sm text-red-500 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full justify-center mt-2"
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : <Lock size={18} />}
            Entrar al panel
          </button>
        </form>
      </div>
    </div>
  );
}
