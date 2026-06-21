"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

const EMPTY = { nombre: "", email: "", tel: "", tipo: "Boda", fecha: "", notas: "" };

export default function NewLeadForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [f, setF] = useState({ ...EMPTY });

  const set =
    <K extends keyof typeof f>(k: K) =>
    (v: string) =>
      setF((p) => ({ ...p, [k]: v }));

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErr(null);
    if (!f.nombre.trim() || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(f.email)) {
      setErr("Completá nombre y un email válido.");
      return;
    }
    setBusy(true);
    const res = await fetch("/api/admin/leads", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(f),
    });
    setBusy(false);
    if (res.ok) {
      setF({ ...EMPTY });
      setOpen(false);
      router.refresh();
    } else {
      setErr("No se pudo crear la consulta. Probá de nuevo.");
    }
  };

  if (!open) {
    return (
      <button className="btn btn-dark" onClick={() => setOpen(true)}>
        + Nueva consulta
      </button>
    );
  }

  return (
    <form className="emb-newform" onSubmit={submit}>
      <div className="emb-newform-grid">
        <input
          className="emb-input"
          placeholder="Nombre"
          value={f.nombre}
          onChange={(e) => set("nombre")(e.target.value)}
        />
        <input
          className="emb-input"
          type="email"
          placeholder="Email"
          value={f.email}
          onChange={(e) => set("email")(e.target.value)}
        />
        <input
          className="emb-input"
          placeholder="Teléfono"
          value={f.tel}
          onChange={(e) => set("tel")(e.target.value)}
        />
        <select
          className="emb-input"
          value={f.tipo}
          onChange={(e) => set("tipo")(e.target.value)}
        >
          <option>Boda</option>
          <option>Otro</option>
        </select>
        <input
          className="emb-input"
          type="date"
          value={f.fecha}
          onChange={(e) => set("fecha")(e.target.value)}
        />
        <input
          className="emb-input"
          placeholder="Nota (opcional)"
          value={f.notas}
          onChange={(e) => set("notas")(e.target.value)}
        />
      </div>
      {err && <span className="cf-err">{err}</span>}
      <div className="emb-newform-actions">
        <button type="submit" className="btn btn-siena adm-row-btn" disabled={busy}>
          {busy ? "Creando…" : "Crear consulta"}
        </button>
        <button
          type="button"
          className="btn btn-outline adm-row-btn"
          disabled={busy}
          onClick={() => {
            setOpen(false);
            setErr(null);
            setF({ ...EMPTY });
          }}
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
