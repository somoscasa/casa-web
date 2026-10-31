"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Info = { name: string; email: string; phone: string; eventDate: string; eventType: string };

const ERRORS: Record<string, string> = {
  missing_fields: "Completá el nombre y el mail.",
  bad_email: "El mail no parece válido. Revisalo.",
  email_taken: "Ese mail ya pertenece a otro cliente de CASA.",
  unauthorized: "Tu sesión expiró. Volvé a entrar al Admin.",
};

export default function ClientInfoEditor({ galleryId, initial }: { galleryId: string; initial: Info }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [f, setF] = useState<Info>(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const set = (k: keyof Info) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setF((p) => ({ ...p, [k]: e.target.value }));

  const save = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/galleries/${galleryId}/client`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...f, eventDate: f.eventDate || null }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.error ?? "x");
      }
      setSaved(true);
      setOpen(false);
      router.refresh();
      setTimeout(() => setSaved(false), 2500);
    } catch (e) {
      const code = e instanceof Error ? e.message : "";
      setError(ERRORS[code] ?? "No se pudo guardar. Revisá tu conexión y probá de nuevo.");
    } finally {
      setBusy(false);
    }
  };

  if (!open) {
    return (
      <button className="adm-sel-link adm-edit-client" onClick={() => setOpen(true)}>
        {saved ? "✓ Datos guardados" : "Editar datos de los novios y fecha"}
      </button>
    );
  }

  return (
    <section className="adm-client-edit">
      <div className="label adm-settings-title">Datos de los novios</div>
      <div className="adm-client-grid">
        <label className="adm-settings-field">
          <span className="adm-settings-label">Nombre</span>
          <input className="adm-input" value={f.name} onChange={set("name")} />
        </label>
        <label className="adm-settings-field">
          <span className="adm-settings-label">Mail</span>
          <input className="adm-input" type="email" value={f.email} onChange={set("email")} />
        </label>
        <label className="adm-settings-field">
          <span className="adm-settings-label">Teléfono (para WhatsApp)</span>
          <input className="adm-input" type="tel" value={f.phone} onChange={set("phone")} placeholder="11 2345 6789" />
        </label>
        <label className="adm-settings-field">
          <span className="adm-settings-label">Fecha del evento</span>
          <input className="adm-input" type="date" value={f.eventDate} onChange={set("eventDate")} />
        </label>
        <label className="adm-settings-field">
          <span className="adm-settings-label">Tipo de evento</span>
          <select className="adm-input" value={f.eventType} onChange={set("eventType")}>
            <option value="boda">Boda</option>
            <option value="quince">Quince</option>
          </select>
        </label>
      </div>
      {error && <p className="cl-err" style={{ marginTop: 12 }}>{error}</p>}
      <div style={{ display: "flex", gap: 10, marginTop: 16, flexWrap: "wrap" }}>
        <button className="btn btn-dark" onClick={save} disabled={busy}>
          {busy ? "Guardando…" : "Guardar datos"}
        </button>
        <button
          className="btn btn-outline"
          onClick={() => {
            setF(initial);
            setError(null);
            setOpen(false);
          }}
          disabled={busy}
        >
          Cancelar
        </button>
      </div>
    </section>
  );
}
