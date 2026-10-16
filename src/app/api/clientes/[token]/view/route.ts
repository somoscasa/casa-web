import { NextResponse } from "next/server";
import { getServiceSupabase, supabaseConfigured } from "@/lib/supabase/server";
import { createHash } from "crypto";

export const dynamic = "force-dynamic";

export async function POST(req: Request, props: { params: Promise<{ token: string }> }) {
  const params = await props.params;
  if (!supabaseConfigured()) return NextResponse.json({ ok: true });

  const svc = getServiceSupabase();
  const { data: gallery } = await svc
    .from("galleries")
    .select("id")
    .eq("access_token", params.token)
    .eq("is_active", true)
    .single();

  if (!gallery) return NextResponse.json({ error: "not_found" }, { status: 404 });

  // Hash the IP for privacy
  const forwarded = req.headers.get("x-forwarded-for") ?? "";
  const ip = forwarded.split(",")[0].trim() || "unknown";
  const ipHash = createHash("sha256").update(ip).digest("hex").slice(0, 16);

  await svc.from("gallery_views").insert({
    gallery_id: (gallery as { id: string }).id,
    ip_hash: ipHash,
  });

  return NextResponse.json({ ok: true });
}
