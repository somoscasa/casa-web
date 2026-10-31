import { NextResponse } from "next/server";
import { getServerSupabase, getServiceSupabase, supabaseConfigured } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/admin";

export const dynamic = "force-dynamic";

type Body = { name?: string; email?: string; phone?: string; eventDate?: string | null; eventType?: string };

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const TYPES = new Set(["boda", "quince"]);

export async function PATCH(req: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  if (!supabaseConfigured()) return NextResponse.json({ error: "not_configured" }, { status: 503 });

  const supabase = await getServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !isAdmin(user.email)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = (await req.json().catch(() => null)) as Body | null;
  if (!body) return NextResponse.json({ error: "bad_request" }, { status: 400 });

  const name = body.name?.trim().slice(0, 200);
  const email = body.email?.trim().toLowerCase().slice(0, 200);
  const phone = body.phone?.trim().slice(0, 50) ?? "";
  if (!name || !email) return NextResponse.json({ error: "missing_fields" }, { status: 400 });
  if (!EMAIL.test(email)) return NextResponse.json({ error: "bad_email" }, { status: 400 });
  const eventDate = body.eventDate && /^\d{4}-\d{2}-\d{2}$/.test(body.eventDate) ? body.eventDate : null;
  const eventType = body.eventType && TYPES.has(body.eventType) ? body.eventType : undefined;

  const svc = getServiceSupabase();
  const { data: g } = await svc
    .from("galleries")
    .select("id, client_id, event_id")
    .eq("id", params.id)
    .maybeSingle();
  if (!g) return NextResponse.json({ error: "not_found" }, { status: 404 });

  if (g.client_id) {
    const { data: clash } = await svc
      .from("clients")
      .select("id")
      .eq("email", email)
      .neq("id", g.client_id)
      .maybeSingle();
    if (clash) return NextResponse.json({ error: "email_taken" }, { status: 409 });

    const { error } = await svc
      .from("clients")
      .update({ name, email, phone: phone || null })
      .eq("id", g.client_id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (g.event_id) {
    const { error } = await svc
      .from("events")
      .update({ date: eventDate, ...(eventType ? { type: eventType } : {}) })
      .eq("id", g.event_id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
