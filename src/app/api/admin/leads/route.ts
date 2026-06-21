import { NextResponse } from "next/server";
import { getServerSupabase, supabaseConfigured } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/admin";
import { createLead } from "@/lib/leads";

type Payload = {
  nombre?: string;
  email?: string;
  tel?: string;
  tipo?: string;
  fecha?: string;
  notas?: string;
};

export async function POST(req: Request) {
  if (!supabaseConfigured())
    return NextResponse.json({ error: "not_configured" }, { status: 503 });
  const supabase = getServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!isAdmin(user.email))
    return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const data = (await req.json()) as Payload;
  const nombre = data.nombre?.trim();
  const email = data.email?.trim().toLowerCase();
  if (!nombre || !email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email))
    return NextResponse.json({ error: "missing_fields" }, { status: 400 });

  try {
    const { clientId, eventId } = await createLead({
      name: nombre,
      email,
      phone: data.tel ?? null,
      type: data.tipo ?? null,
      date: data.fecha ?? null,
      notes: data.notas ?? null,
    });
    return NextResponse.json({ ok: true, clientId, eventId });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "create_failed" },
      { status: 500 },
    );
  }
}
