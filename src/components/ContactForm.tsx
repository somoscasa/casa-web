"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";

type Errors = Partial<Record<"nombre" | "email" | "tipo" | "form", string>>;

export default function ContactForm() {
  const [f, setF] = useState({
    nombre: "",
    email: "",
    tel: "",
    tipo: "",
    fecha: "",
    msg: "",
  });
  const [errors, setErrors] = useState<Errors>({});
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const set =
    <K extends keyof typeof f>(k: K) =>
    (v: string) => {
      setF((p) => ({ ...p, [k]: v }));
      setErrors((e) => ({ ...e, [k]: undefined, form: undefined }));
    };

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const errs: Errors = {};
    if (!f.nombre.trim()) errs.nombre = "Decinos cómo te llamás.";
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(f.email)) errs.email = "Email no válido.";
    if (!f.tipo) errs.tipo = "Elegí un tipo de evento.";
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setSending(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(f),
      });
      if (!res.ok) throw new Error("send_failed");
      setSent(true);
    } catch {
      setErrors({ form: "No pudimos enviar la consulta. Probá de nuevo o escribinos por WhatsApp." });
    } finally {
      setSending(false);
    }
  };

  if (sent) {
    return (
      <div className="ct-sent">
        <div className="serif ct-sent-mark">✓</div>
        <h2 className="serif ct-sent-title">Recibimos tu consulta.</h2>
        <p className="body ct-sent-body">
          Gracias, {f.nombre.split(" ")[0] || "che"}. Te escribimos a la
          brevedad — normalmente dentro de las 48 horas.
        </p>
        <Link href="/" className="link-arrow">
          Volver al inicio <span className="arr">→</span>
        </Link>
      </div>
    );
  }

  return (
    <form className="cf" onSubmit={submit} noValidate>
      <div className="label cf-eyebrow">Consultas 2026 · 2027</div>

      <label className="cf-field">
        <span className="cf-label label">Nombre completo</span>
        <input
          className={`cf-input ${errors.nombre ? "cf-input-err" : ""}`}
          type="text"
          value={f.nombre}
          onChange={(e) => set("nombre")(e.target.value)}
        />
        {errors.nombre && <span className="cf-err">{errors.nombre}</span>}
      </label>

      <label className="cf-field">
        <span className="cf-label label">Email</span>
        <input
          className={`cf-input ${errors.email ? "cf-input-err" : ""}`}
          type="email"
          value={f.email}
          onChange={(e) => set("email")(e.target.value)}
        />
        {errors.email && <span className="cf-err">{errors.email}</span>}
      </label>

      <label className="cf-field">
        <span className="cf-label label">Teléfono</span>
        <input
          className="cf-input"
          type="tel"
          value={f.tel}
          onChange={(e) => set("tel")(e.target.value)}
        />
      </label>

      <label className="cf-field">
        <span className="cf-label label">Tipo de evento</span>
        <div className="cf-select-wrap">
          <select
            className={`cf-input cf-select ${errors.tipo ? "cf-input-err" : ""}`}
            value={f.tipo}
            onChange={(e) => set("tipo")(e.target.value)}
          >
            <option value="" disabled>Elegí una opción</option>
            <option>Boda</option>
            <option>Quince</option>
            <option>Cumpleaños</option>
            <option>Evento social</option>
            <option>Otro</option>
          </select>
          <span className="cf-select-chev" aria-hidden>▾</span>
        </div>
        {errors.tipo && <span className="cf-err">{errors.tipo}</span>}
      </label>

      <label className="cf-field">
        <span className="cf-label label">Fecha del evento</span>
        <input
          className="cf-input"
          type="date"
          value={f.fecha}
          onChange={(e) => set("fecha")(e.target.value)}
        />
      </label>

      <label className="cf-field">
        <span className="cf-label label">Mensaje · contanos más</span>
        <textarea
          className="cf-input cf-textarea"
          rows={3}
          value={f.msg}
          onChange={(e) => set("msg")(e.target.value)}
          placeholder="Locación, cantidad de invitados, qué te imaginás…"
        />
      </label>

      {errors.form && <span className="cf-err">{errors.form}</span>}

      <button type="submit" className="btn btn-dark cf-submit" disabled={sending}>
        {sending ? "Enviando…" : "Enviar consulta"}
      </button>
    </form>
  );
}
