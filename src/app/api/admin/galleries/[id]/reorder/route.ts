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

  const body = await req.json() as { order: string[] };
  if (!Array.isArray(body.order)) return NextResponse.json({ error: "bad_request" }, { status: 400 });

  const svc = getServiceSupabase();

  // Batch updates in chunks of 100 to avoid overwhelming the DB
  const CHUNK = 100;
  for (let i = 0; i < body.order.length; i += CHUNK) {
    const chunk = body.order.slice(i, i + CHUNK);
    const results = await Promise.all(
      chunk.map((photoId, j) =>
        svc.from("photos").update({ sort_order: i + j }).eq("id", photoId).eq("gallery_id", params.id),
      ),
    );
    if (results.some((r) => r.error)) {
      return NextResponse.json({ error: "partial_fail" }, { status: 500 });
    }
  }

  return NextResponse.json({ ok: true });
}
