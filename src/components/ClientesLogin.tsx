"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

export default function ClientesLogin() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [shake, setShake] = useState(false);
  const [busy, setBusy] = useState(false);

  const fail = (msg: string) => {
    setError(msg);
    setShake(true);
    setTimeout(() => setShake(false), 500);
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const c = code.trim();
    if (!c) {
      fail("Ingresá el código que te enviamos.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(
        `/api/clientes/check?token=${encodeURIComponent(c)}`,
        { cache: "no-store" },
      );
      if (res.status === 503) {
        fail(
          "Las galerías privadas se habilitan próximamente. Escribinos y te las enviamos por mail.",
        );
        return;
      }
      if (res.status === 404) {
        fail("Ese código no existe o ya no está activo.");
        return;
      }
      if (!res.ok) {
        fail("No pudimos verificar el código. Probá de nuevo.");
        return;
      }
      router.push(`/clientes/${encodeURIComponent(c)}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <main id="main" className="cl-login">
      <Link href="/" className="wordmark cl-back" aria-label="Volver a CASA">
        CASA
      </Link>

      <div className={`cl-card ${shake ? "shake" : ""}`}>
        <div className="wordmark cl-card-mark">CASA</div>
        <h1 className="serif cl-card-title">Área de clientes</h1>
        <p className="cl-card-sub">
          Ingresá el código privado que recibiste por mail.
        </p>

        <form className="cl-form" onSubmit={submit} noValidate>
          <input
            className={`cl-input ${error ? "cl-input-err" : ""}`}
            type="text"
            placeholder="CÓDIGO DE ACCESO"
            value={code}
            onChange={(e) => {
              setCode(e.target.value);
              setError(null);
            }}
            autoFocus
          />
          {error && <span className="cl-err">{error}</span>}
          <button
            type="submit"
            className="btn btn-dark cl-submit"
            disabled={busy}
          >
            {busy ? "Verificando…" : "Entrar"}
          </button>
        </form>

        <p className="label cl-hint">
          ¿No tenés código?{" "}
          <Link href="/contacto" style={{ color: "var(--siena)" }}>
            Escribinos
          </Link>
          .
        </p>

        <p className="cl-foot">
          Las galerías están protegidas. Solo podés acceder con tu link privado.
        </p>
      </div>
    </main>
  );
}
