"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { getBrowserSupabase, browserSupabaseConfigured } from "@/lib/supabase/browser";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const urlError =
    typeof window !== "undefined"
      ? new URLSearchParams(window.location.search).get("error")
      : null;

  if (!browserSupabaseConfigured()) {
    return (
      <main id="main" className="cl-login">
        <Link href="/" className="wordmark cl-back">CASA</Link>
        <div className="cl-card">
          <div className="wordmark cl-card-mark">CASA</div>
          <h1 className="serif cl-card-title">Admin</h1>
          <p className="cl-card-sub">
            El backend no está configurado todavía. Agregá las claves de
            Supabase en Vercel y recargá esta página.
          </p>
        </div>
      </main>
    );
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const supabase = getBrowserSupabase();
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo:
            typeof window !== "undefined"
              ? `${window.location.origin}/auth/callback?next=/admin`
              : undefined,
        },
      });
      if (error) throw error;
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No pudimos enviar el link.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main id="main" className="cl-login">
      <Link href="/" className="wordmark cl-back">CASA</Link>

      <div className="cl-card">
        <div className="wordmark cl-card-mark">CASA</div>
        <h1 className="serif cl-card-title">Admin</h1>
        <p className="cl-card-sub">
          {sent
            ? "Revisá tu mail. Te mandamos un link mágico para entrar."
            : "Ingresá tu mail. Te enviamos un link para entrar."}
        </p>

        {!sent && (
          <form className="cl-form" onSubmit={submit} noValidate>
            <input
              className={`cl-input ${error || urlError ? "cl-input-err" : ""}`}
              type="email"
              placeholder="TU EMAIL"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError(null);
              }}
              required
              autoFocus
            />
            {(error || urlError) && (
              <span className="cl-err">
                {error ?? `El link expiró o ya se usó: ${urlError}. Pedí uno nuevo.`}
              </span>
            )}
            <button
              type="submit"
              className="btn btn-dark cl-submit"
              disabled={loading}
            >
              {loading ? "Enviando…" : "Recibir link"}
            </button>
          </form>
        )}

        <p className="cl-foot">Solo el equipo de CASA puede acceder.</p>
      </div>
    </main>
  );
}
