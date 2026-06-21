import { NextResponse } from "next/server";
import { supabaseConfigured } from "@/lib/supabase/server";
import { createLead } from "@/lib/leads";

type Payload = {
  nombre?: string;
  email?: string;
  tel?: string;
  tipo?: string;
  fecha?: string;
  msg?: string;
};

const TO = process.env.NEXT_PUBLIC_EMAIL ?? "somoscasa.ar@gmail.com";
const FROM = process.env.RESEND_FROM ?? "CASA <contacto@somoscasa.com.ar>";

function escape(s: string) {
  return s.replace(/[<>&]/g, (c) =>
    c === "<" ? "&lt;" : c === ">" ? "&gt;" : "&amp;",
  );
}

export async function POST(req: Request) {
  const data = (await req.json()) as Payload;
  const { nombre = "", email = "", tel = "", tipo = "", fecha = "", msg = "" } = data;

  if (!nombre.trim() || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) || !tipo) {
    return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  }

  // Persistir la consulta en el embudo (best-effort: nunca rompe el envío).
  if (supabaseConfigured()) {
    try {
      await createLead({
        name: nombre,
        email,
        phone: tel,
        type: tipo,
        date: fecha || null,
        notes: msg || null,
      });
    } catch (e) {
      console.error("[contact] no se pudo crear el lead:", e);
    }
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    // Dev fallback: log and accept so the UI flow can be tested without keys.
    console.warn("[contact] RESEND_API_KEY not set — accepting without send.", {
      nombre, email, tel, tipo, fecha, msg,
    });
    return NextResponse.json({ ok: true, devFallback: true });
  }

  const html = `
    <h2 style="font-family:Georgia,serif;">Nueva consulta — CASA</h2>
    <table style="font-family:Arial,sans-serif;font-size:14px;border-collapse:collapse;">
      <tr><td><b>Nombre</b></td><td>${escape(nombre)}</td></tr>
      <tr><td><b>Email</b></td><td>${escape(email)}</td></tr>
      <tr><td><b>Teléfono</b></td><td>${escape(tel)}</td></tr>
      <tr><td><b>Tipo</b></td><td>${escape(tipo)}</td></tr>
      <tr><td><b>Fecha</b></td><td>${escape(fecha)}</td></tr>
    </table>
    <p style="font-family:Arial,sans-serif;font-size:14px;white-space:pre-wrap;">${escape(msg)}</p>
  `;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: FROM,
      to: [TO],
      reply_to: email,
      subject: `CASA — Nueva consulta · ${tipo}`,
      html,
    }),
  });

  if (!res.ok) {
    const detail = await res.text();
    return NextResponse.json({ error: "send_failed", detail }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
