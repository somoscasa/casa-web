import { NextResponse } from "next/server";
import { getServiceSupabase, supabaseConfigured } from "@/lib/supabase/server";
import { galleryIsOpen } from "@/lib/gallery-data";
import { isLimited, recordHit, visitorKey } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  if (!supabaseConfigured()) {
    return NextResponse.json({ error: "not_configured" }, { status: 503 });
  }
  const token = new URL(req.url).searchParams.get("token")?.trim().toUpperCase();
  if (!token) return NextResponse.json({ error: "missing" }, { status: 400 });

  const svc = getServiceSupabase();
  const key = visitorKey(req.headers);
  if (await isLimited(svc, "code", key)) {
    return NextResponse.json({ error: "too_many" }, { status: 429 });
  }
  const { data, error } = await svc
    .from("galleries")
    .select("id, is_active, expires_at")
    .eq("access_token", token)
    .maybeSingle();

  if (error || !data || !galleryIsOpen(data)) {
    if (!data) await recordHit(svc, "code", key);
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
