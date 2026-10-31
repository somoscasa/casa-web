import { NextResponse } from "next/server";
import { getServerSupabase, getServiceSupabase, supabaseConfigured } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/admin";
import { normalizeEventType } from "@/lib/crm";

type Payload = {
  title?: string;
  clientName?: string;
  clientEmail?: string;
  clientPhone?: string;
  eventType?: string;
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
  const eventType = normalizeEventType(body.eventType) ?? "boda";
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

  // Reuse the couple's inquiry if it has no gallery yet, so the funnel doesn't get a duplicate.
  const { data: candidates } = await svc
    .from("events")
    .select("id, type, date, galleries ( id )")
    .eq("client_id", client.id)
    .order("created_at", { ascending: false });
  const free = (candidates ?? []).filter(
    (e) => !(e.galleries as unknown as { id: string }[] | null)?.length,
  );
  const reuse =
    free.find((e) => eventDate && e.date === eventDate) ??
    free.find((e) => e.type === eventType && (!e.date || !eventDate)) ??
    null;

  let event: { id: string } | null = null;
  let eErr: { code?: string; message: string } | null = null;
  if (reuse) {
    const { error } = await svc
      .from("events")
      .update({ type: eventType, ...(eventDate ? { date: eventDate } : {}) })
      .eq("id", reuse.id);
    event = { id: reuse.id };
    eErr = error;
  } else {
    ({ data: event, error: eErr } = await svc
      .from("events")
      .insert({ client_id: client.id, type: eventType, date: eventDate })
      .select("id")
      .single());
  }
  if (eErr?.code === "23514") {
    return NextResponse.json({ error: "type_not_allowed" }, { status: 400 });
  }
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
