import { NextResponse } from "next/server";
import {
  getServerSupabase,
  getServiceSupabase,
  supabaseConfigured,
} from "@/lib/supabase/server";
import { isAdmin } from "@/lib/admin";
import { STAGES } from "@/lib/crm";

const STAGE_SET = new Set<string>(STAGES);

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } },
) {
  if (!supabaseConfigured())
    return NextResponse.json({ error: "not_configured" }, { status: 503 });
  const supabase = getServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!isAdmin(user.email))
    return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const body = (await req.json()) as {
    status?: string;
    notes?: string | null;
  };

  const update: Record<string, string | null> = {};
  if (body.status !== undefined) {
    const s = body.status.toLowerCase();
    if (!STAGE_SET.has(s))
      return NextResponse.json({ error: "invalid_status" }, { status: 400 });
    update.status = s;
  }
  if (body.notes !== undefined) {
    const n = (body.notes ?? "").trim();
    update.notes = n.length > 0 ? n : null;
  }

  if (Object.keys(update).length === 0)
    return NextResponse.json({ error: "no_change" }, { status: 400 });

  const svc = getServiceSupabase();
  const { error } = await svc.from("events").update(update).eq("id", params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
