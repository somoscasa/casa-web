import { NextResponse } from "next/server";
import { getServerSupabase, getServiceSupabase, supabaseConfigured } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/admin";
import { thumbPath } from "@/lib/gallery-data";

export const dynamic = "force-dynamic";

const CHUNK = 100;

type Body =
  | { action: "delete"; ids: string[] }
  | { action: "move"; ids: string[]; collection_id: string | null };

export async function POST(req: Request, { params }: { params: { id: string } }) {
  if (!supabaseConfigured()) return NextResponse.json({ error: "not_configured" }, { status: 503 });

  const supabase = getServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !isAdmin(user.email)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = (await req.json().catch(() => null)) as Body | null;
  if (!body || !Array.isArray(body.ids) || body.ids.length === 0) {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  const svc = getServiceSupabase();

  if (body.action === "move") {
    if (body.collection_id) {
      const { data: coll } = await svc
        .from("collections")
        .select("id")
        .eq("id", body.collection_id)
        .eq("gallery_id", params.id)
        .maybeSingle();
      if (!coll) return NextResponse.json({ error: "collection_not_found" }, { status: 404 });
    }
    for (let i = 0; i < body.ids.length; i += CHUNK) {
      const { error } = await svc
        .from("photos")
        .update({ collection_id: body.collection_id })
        .in("id", body.ids.slice(i, i + CHUNK))
        .eq("gallery_id", params.id);
      if (error) return NextResponse.json({ error: error.message, done: i }, { status: 500 });
    }
    return NextResponse.json({ ok: true, count: body.ids.length });
  }

  if (body.action === "delete") {
    let deleted = 0;
    for (let i = 0; i < body.ids.length; i += CHUNK) {
      const chunk = body.ids.slice(i, i + CHUNK);
      const { data: rows, error: selErr } = await svc
        .from("photos")
        .select("id, storage_path")
        .in("id", chunk)
        .eq("gallery_id", params.id);
      if (selErr) return NextResponse.json({ error: selErr.message, deleted }, { status: 500 });
      if (!rows?.length) continue;

      await svc.storage
        .from("photos")
        .remove(rows.flatMap((r) => [r.storage_path, thumbPath(r.storage_path)]));
      const { error } = await svc.from("photos").delete().in("id", rows.map((r) => r.id));
      if (error) return NextResponse.json({ error: error.message, deleted }, { status: 500 });
      deleted += rows.length;
    }
    return NextResponse.json({ ok: true, count: deleted });
  }

  return NextResponse.json({ error: "bad_action" }, { status: 400 });
}
