import { NextResponse } from "next/server";
import { getServerSupabase, getServiceSupabase, supabaseConfigured } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/admin";

export const dynamic = "force-dynamic";

export async function PATCH(req: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  if (!supabaseConfigured()) return NextResponse.json({ error: "not_configured" }, { status: 503 });

  const supabase = await getServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !isAdmin(user.email)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json() as {
    title?: string;
    expires_at?: string | null;
    download_permission?: "none" | "web" | "original";
    watermark_enabled?: boolean;
    is_active?: boolean;
    cover_photo_id?: string | null;
  };

  const allowed: Record<string, unknown> = {};
  if (body.title !== undefined) allowed.title = body.title;
  if (body.expires_at !== undefined) allowed.expires_at = body.expires_at;
  if (body.download_permission !== undefined) allowed.download_permission = body.download_permission;
  if (body.watermark_enabled !== undefined) allowed.watermark_enabled = body.watermark_enabled;
  if (body.is_active !== undefined) allowed.is_active = body.is_active;
  if (body.cover_photo_id !== undefined) allowed.cover_photo_id = body.cover_photo_id;

  const svc = getServiceSupabase();
  const { error } = await svc.from("galleries").update(allowed).eq("id", params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
