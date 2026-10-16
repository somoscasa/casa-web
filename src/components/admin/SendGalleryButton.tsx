"use client";

import { useState } from "react";

/** WhatsApp needs 549 + area + number for Argentine mobiles; empty lets you pick the contact. */
function waNumber(phone: string | null) {
  let d = (phone ?? "").replace(/\D/g, "").replace(/^00/, "");
  if (!d) return "";
  if (d.startsWith("54")) d = d.slice(2);
  d = d.replace(/^0/, "").replace(/^9/, "");
  if (d.length === 12 && d.slice(2, 4) === "15") d = d.slice(0, 2) + d.slice(4);
  return d.length === 10 ? `549${d}` : (phone ?? "").replace(/\D/g, "");
}

export default function SendGalleryButton({
  galleryId,
  clientEmail,
  clientName,
  clientPhone,
  accessCode,
  galleryUrl,
  loginUrl,
  alreadySent,
}: {
  galleryId: string;
  clientEmail: string;
  clientName: string | null;
  clientPhone: string | null;
  accessCode: string;
  galleryUrl: string;
  loginUrl: string;
  alreadySent: boolean;
}) {
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">(
    alreadySent ? "sent" : "idle"
  );
  const [copied, setCopied] = useState(false);

  const greeting = clientName ? `¡Hola ${clientName}!` : "¡Hola!";
  const message =
    `${greeting} Tu galería de CASA ya está lista 🤍\n\n` +
    `Entrá acá para verla y descargar tus fotos:\n${galleryUrl}\n\n` +
    `Si te pide un código, es: ${accessCode}\n(también podés entrar desde ${loginUrl})`;

  const waUrl = `https://wa.me/${waNumber(clientPhone)}?text=${encodeURIComponent(message)}`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      prompt("Copiá este mensaje:", message);
    }
  };

  const send = async () => {
    if (!confirm(`Enviar la galería por mail a ${clientEmail}?`)) return;
    setState("sending");
    try {
      const res = await fetch(`/api/admin/galleries/${galleryId}/send`, { method: "POST" });
      setState(res.ok ? "sent" : "error");
    } catch {
      setState("error");
    }
  };

  return (
    <div className="adm-send-box">
      <div>
        <div className="label">Avisar a los novios</div>
        <div className="adm-send-email">{clientEmail}</div>
        {alreadySent && state === "sent" && (
          <div className="adm-send-hint">✓ El mail ya fue enviado. Podés reenviarlo.</div>
        )}
        {state === "error" && (
          <div className="adm-send-hint adm-send-err">
            El mail no se pudo enviar. Mientras no esté conectado el dominio propio, los mails solo
            llegan a la casilla de CASA. Usá WhatsApp o copiá el mensaje.
          </div>
        )}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <a className="btn btn-siena" href={waUrl} target="_blank" rel="noopener noreferrer">
          Enviar por WhatsApp
        </a>
        <button className="btn btn-outline" onClick={copy}>
          {copied ? "✓ Mensaje copiado" : "Copiar mensaje"}
        </button>
        <button
          className="btn btn-outline"
          onClick={send}
          disabled={state === "sending"}
        >
          {state === "sending"
            ? "Enviando…"
            : state === "sent" && !alreadySent
            ? "✓ Mail enviado"
            : alreadySent
            ? "Reenviar por mail"
            : "Enviar por mail"}
        </button>
      </div>
    </div>
  );
}
