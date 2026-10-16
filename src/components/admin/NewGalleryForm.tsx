"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

export default function NewGalleryForm() {
  const router = useRouter();
  const [f, setF] = useState({
    title: "",
    clientName: "",
    clientEmail: "",
    clientPhone: "",
    eventType: "boda" as "boda" | "quince",
    eventDate: "",
  });
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const set =
    <K extends keyof typeof f>(k: K) =>
    (v: (typeof f)[K]) =>
      setF((p) => ({ ...p, [k]: v }));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setErr(null);
    if (!f.clientName.trim() || !f.clientEmail.trim()) {
      setErr("Completá el nombre y el email del cliente.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.clientEmail.trim())) {
      setErr("El email no parece válido. Revisalo.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/admin/galleries", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(f),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.error ?? "no_create");
      }
      const j = await res.json();
      router.push(`/admin/galerias/${j.gallery_id}`);
    } catch (e) {
      const code = e instanceof Error ? e.message : "";
      setErr(
        code === "unauthorized" || code === "forbidden"
          ? "Tu sesión expiró. Volvé a entrar al Admin."
          : "No se pudo crear la galería. Probá de nuevo en un momento.",
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className="cf" onSubmit={submit} noValidate>
      <label className="cf-field">
        <span className="cf-label label">Título de la galería</span>
        <input
          className="cf-input"
          value={f.title}
          onChange={(e) => set("title")(e.target.value)}
          placeholder="Catalina y Tomás · Boda 2026"
        />
      </label>

      <label className="cf-field">
        <span className="cf-label label">Nombre del cliente</span>
        <input
          className="cf-input"
          value={f.clientName}
          onChange={(e) => set("clientName")(e.target.value)}
          required
        />
      </label>

      <label className="cf-field">
        <span className="cf-label label">Email del cliente</span>
        <input
          className="cf-input"
          type="email"
          value={f.clientEmail}
          onChange={(e) => set("clientEmail")(e.target.value)}
          required
        />
      </label>

      <label className="cf-field">
        <span className="cf-label label">Teléfono (opcional)</span>
        <input
          className="cf-input"
          type="tel"
          value={f.clientPhone}
          onChange={(e) => set("clientPhone")(e.target.value)}
        />
      </label>

      <label className="cf-field">
        <span className="cf-label label">Tipo de evento</span>
        <div className="cf-select-wrap">
          <select
            className="cf-input cf-select"
            value={f.eventType}
            onChange={(e) => set("eventType")(e.target.value as "boda" | "quince")}
          >
            <option value="boda">Boda</option>
            <option value="quince">Quince</option>
          </select>
          <span className="cf-select-chev" aria-hidden>▾</span>
        </div>
      </label>

      <label className="cf-field">
        <span className="cf-label label">Fecha del evento (opcional)</span>
        <input
          className="cf-input"
          type="date"
          value={f.eventDate}
          onChange={(e) => set("eventDate")(e.target.value)}
        />
      </label>

      {err && <span className="cf-err">{err}</span>}
      <button type="submit" className="btn btn-dark cf-submit" disabled={busy}>
        {busy ? "Creando…" : "Crear galería"}
      </button>
    </form>
  );
}
