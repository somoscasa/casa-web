import { NextResponse } from "next/server";
import { getServiceSupabase, supabaseConfigured } from "@/lib/supabase/server";
import { galleryIsOpen } from "@/lib/gallery-data";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  if (!supabaseConfigured()) {
    return NextResponse.json({ error: "not_configured" }, { status: 503 });
  }
  const token = new URL(req.url).searchParams.get("token")?.trim();
  if (!token) return NextResponse.json({ error: "missing" }, { status: 400 });

  const svc = getServiceSupabase();
  const { data, error } = await svc
    .from("galleries")
    .select("id, is_active, expires_at")
    .eq("access_token", token)
    .maybeSingle();

  if (error || !data || !galleryIsOpen(data)) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
