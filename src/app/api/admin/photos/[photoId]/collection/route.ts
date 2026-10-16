import { NextResponse } from "next/server";
import { getServerSupabase, getServiceSupabase, supabaseConfigured } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/admin";

export const dynamic = "force-dynamic";

export async function PATCH(req: Request, props: { params: Promise<{ photoId: string }> }) {
  const params = await props.params;
  if (!supabaseConfigured()) return NextResponse.json({ error: "not_configured" }, { status: 503 });
  const supabase = await getServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !isAdmin(user.email)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { collection_id } = await req.json();
  const svc = getServiceSupabase();
  const { error } = await svc.from("photos").update({ collection_id: collection_id ?? null }).eq("id", params.photoId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
