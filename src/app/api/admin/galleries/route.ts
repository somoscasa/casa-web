import { NextResponse } from "next/server";
import { getServerSupabase, getServiceSupabase, supabaseConfigured } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/admin";

type Payload = {
  title?: string;
  clientName?: string;
  clientEmail?: string;
  clientPhone?: string;
  eventType?: "boda" | "quince";
  eventDate?: string;
};

export async function POST(req: Request) {
  if (!supabaseConfigured()) {
    return NextResponse.json({ error: "supabase_not_configured" }, { status: 503 });
  }
  const supabase = await getServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!isAdmin(user.email))
    return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const body = (await req.json()) as Payload;
  const title = body.title?.trim() || null;
  const clientName = body.clientName?.trim();
  const clientEmail = body.clientEmail?.trim().toLowerCase();
  const clientPhone = body.clientPhone?.trim() || null;
  const eventType = body.eventType ?? "boda";
  const eventDate = body.eventDate || null;

  if (!clientName || !clientEmail) {
    return NextResponse.json({ error: "missing_client" }, { status: 400 });
  }

  const svc = getServiceSupabase();

  // upsert client
  const { data: client, error: cErr } = await svc
    .from("clients")
    .upsert(
      clientPhone
        ? { name: clientName, email: clientEmail, phone: clientPhone }
        : { name: clientName, email: clientEmail },
      { onConflict: "email" },
    )
    .select()
    .single();
  if (cErr || !client) {
    return NextResponse.json({ error: cErr?.message ?? "client_upsert" }, { status: 500 });
  }

  const { data: event, error: eErr } = await svc
    .from("events")
    .insert({
      client_id: client.id,
      type: eventType,
      date: eventDate,
    })
    .select()
    .single();
  if (eErr || !event) {
    return NextResponse.json({ error: eErr?.message ?? "event_create" }, { status: 500 });
  }

  const { data: gallery, error: gErr } = await svc
    .from("galleries")
    .insert({
      title,
      client_id: client.id,
      event_id: event.id,
    })
    .select()
    .single();
  if (gErr || !gallery) {
    return NextResponse.json({ error: gErr?.message ?? "gallery_create" }, { status: 500 });
  }

  return NextResponse.json({
    gallery_id: gallery.id,
    access_token: gallery.access_token,
  });
}
