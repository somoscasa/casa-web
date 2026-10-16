import { NextResponse } from "next/server";
import { getServerSupabase, getServiceSupabase, supabaseConfigured } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/admin";

export const dynamic = "force-dynamic";

export async function POST(
  _req: Request,
  { params }: { params: { id: string } },
) {
  if (!supabaseConfigured()) return NextResponse.json({ error: "not_configured" }, { status: 503 });

  const supabase = getServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !isAdmin(user.email)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const svc = getServiceSupabase();
  const { data: gallery } = await svc
    .from("galleries")
    .select("id, title, access_token, clients(name, email), events(date, type)")
    .eq("id", params.id)
    .single();

  if (!gallery) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const g = gallery as unknown as {
    title: string | null;
    access_token: string;
    clients: { name: string | null; email: string } | null;
    events: { date: string | null; type: string | null } | null;
  };

  if (!g.clients?.email) return NextResponse.json({ error: "no_client_email" }, { status: 400 });

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://casa-web-chi.vercel.app";
  const code = g.access_token;
  const clientName = g.clients.name ?? "hola";
  const galleryTitle = g.title ?? "Tu galería";
  const galleryUrl = `${siteUrl}/clientes/${code}`;

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Tu galería está lista — CASA</title>
</head>
<body style="margin:0;padding:0;background:#F7F2E9;font-family:'DM Sans',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F7F2E9;padding:60px 24px;">
    <tr><td align="center">
      <table width="100%" style="max-width:560px;background:#F7F2E9;">
        <tr><td style="padding-bottom:48px;text-align:center;">
          <div style="font-family:Georgia,serif;font-size:28px;letter-spacing:0.28em;color:#1C1714;">C A S A</div>
        </td></tr>
        <tr><td style="padding-bottom:32px;">
          <p style="font-family:Georgia,serif;font-size:28px;font-style:italic;color:#1C1714;margin:0 0 16px;">
            Tu galería está lista, ${clientName}.
          </p>
          <p style="font-size:15px;color:#1C1714;margin:0;line-height:1.7;">
            ${galleryTitle} ya está disponible para ver y descargar.
          </p>
        </td></tr>
        <tr><td style="background:#1C1714;padding:40px;text-align:center;margin-bottom:32px;">
          <div style="font-family:Georgia,serif;font-size:13px;letter-spacing:0.18em;color:#9B8E85;margin-bottom:12px;text-transform:uppercase;">Tu código de acceso</div>
          <div style="font-family:Georgia,serif;font-size:44px;letter-spacing:0.18em;color:#F7F2E9;line-height:1;">${code}</div>
        </td></tr>
        <tr><td style="padding:32px 0;text-align:center;">
          <a href="${galleryUrl}" style="display:inline-block;background:#1C1714;color:#F7F2E9;font-family:'DM Sans',Arial,sans-serif;font-size:11px;letter-spacing:0.18em;text-transform:uppercase;text-decoration:none;padding:16px 40px;">
            Ver galería
          </a>
        </td></tr>
        <tr><td style="padding-bottom:24px;">
          <p style="font-size:13px;color:#9B8E85;margin:0;line-height:1.7;">
            También podés entrar en <a href="${siteUrl}/clientes" style="color:#B5623E;text-decoration:none;">${siteUrl.replace(/^https?:\/\//,"")}/clientes</a> y poner el código <strong style="color:#1C1714;">${code}</strong>.
          </p>
        </td></tr>
        <tr><td style="border-top:1px solid #1C171415;padding-top:32px;">
          <p style="font-size:12px;color:#9B8E85;margin:0;line-height:1.7;">
            CASA Estudio Audiovisual · Villa Crespo, Buenos Aires
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  const resendKey = process.env.RESEND_API_KEY;
  const resendFrom = process.env.RESEND_FROM ?? "CASA <onboarding@resend.dev>";
  if (!resendKey) return NextResponse.json({ error: "resend_not_configured" }, { status: 503 });

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: resendFrom,
      to: [g.clients.email],
      subject: `Tu galería está lista — ${galleryTitle}`,
      html,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    return NextResponse.json({ error: err }, { status: 500 });
  }

  // Mark as sent
  await svc.from("galleries").update({ notification_sent_at: new Date().toISOString() }).eq("id", params.id);

  return NextResponse.json({ ok: true });
}
