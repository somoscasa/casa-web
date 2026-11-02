import { NextResponse } from "next/server";
import {
  getServiceSupabase,
  supabaseConfigured,
} from "@/lib/supabase/server";
import { isLimited, recordHit, visitorKey } from "@/lib/rate-limit";
import { createPreference, mercadopagoConfigured } from "@/lib/mercadopago";
import { PACKAGES } from "@/lib/site";

type Payload = {
  nombre?: string;
  email?: string;
  tel?: string;
  eventoTipo?: "boda" | "quince";
  eventoFecha?: string;
  paquete?: string;
  notas?: string;
};

const BASE =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://casa-web-chi.vercel.app";
const DEPOSIT = Number(process.env.NEXT_PUBLIC_DEPOSIT_AMOUNT ?? "0");

export async function POST(req: Request) {
  if (!mercadopagoConfigured() || !supabaseConfigured() || DEPOSIT <= 0) {
    return NextResponse.json({ error: "not_configured" }, { status: 503 });
  }

  {
    const svc = getServiceSupabase();
    const key = visitorKey(req.headers);
    if (await isLimited(svc, "contact", key)) {
      return NextResponse.json({ error: "too_many" }, { status: 429 });
    }
    await recordHit(svc, "contact", key);
  }

  const data = (await req.json()) as Payload;
  const nombre = data.nombre?.trim();
  const email = data.email?.trim().toLowerCase();
  const tel = data.tel?.trim() ?? null;
  const eventoTipo = data.eventoTipo ?? "boda";
  const eventoFecha = data.eventoFecha;
  const paqueteId = data.paquete;
  const notas = data.notas?.trim() ?? null;

  if (!nombre || !email || !eventoFecha) {
    return NextResponse.json({ error: "missing_fields" }, { status: 400 });
  }
  const pkg = PACKAGES.find((p) => p.id === paqueteId);
  if (!pkg) return NextResponse.json({ error: "invalid_package" }, { status: 400 });

  const svc = getServiceSupabase();

  const { data: client, error: cErr } = await svc
    .from("clients")
    .upsert({ name: nombre, email, phone: tel }, { onConflict: "email" })
    .select()
    .single();
  if (cErr || !client)
    return NextResponse.json({ error: cErr?.message ?? "client_upsert" }, { status: 500 });

  const { data: event, error: eErr } = await svc
    .from("events")
    .insert({
      client_id: client.id,
      type: eventoTipo,
      date: eventoFecha,
      package: pkg.id,
      notes: notas,
    })
    .select()
    .single();
  if (eErr || !event)
    return NextResponse.json({ error: eErr?.message ?? "event_create" }, { status: 500 });

  const { data: booking, error: bErr } = await svc
    .from("bookings")
    .insert({
      event_id: event.id,
      amount_deposit: DEPOSIT,
      payment_status: "pending",
    })
    .select()
    .single();
  if (bErr || !booking)
    return NextResponse.json({ error: bErr?.message ?? "booking_create" }, { status: 500 });

  try {
    const pref = await createPreference({
      items: [
        {
          title: `CASA — Seña ${pkg.name} (${eventoTipo})`,
          quantity: 1,
          unit_price: DEPOSIT,
        },
      ],
      external_reference: booking.id,
      payer: { name: nombre, email },
      back_urls: {
        success: `${BASE}/reservar/exito?b=${booking.id}`,
        failure: `${BASE}/reservar/falla?b=${booking.id}`,
        pending: `${BASE}/reservar/pendiente?b=${booking.id}`,
      },
      notification_url: `${BASE}/api/mp/webhook`,
    });

    await svc
      .from("bookings")
      .update({ payment_id: pref.id })
      .eq("id", booking.id);

    return NextResponse.json({
      init_point: pref.init_point,
      booking_id: booking.id,
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "mp_error" },
      { status: 502 },
    );
  }
}
