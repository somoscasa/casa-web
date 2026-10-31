import { NextResponse } from "next/server";
import { getServerSupabase, getServiceSupabase, supabaseConfigured } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/admin";
import { thumbPath } from "@/lib/gallery-data";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

const CHUNK = 500;

export async function DELETE(_req: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  if (!supabaseConfigured()) return NextResponse.json({ error: "not_configured" }, { status: 503 });

  const supabase = await getServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !isAdmin(user.email)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const svc = getServiceSupabase();
  const { data: gallery } = await svc.from("galleries").select("id").eq("id", params.id).maybeSingle();
  if (!gallery) return NextResponse.json({ error: "not_found" }, { status: 404 });

  // Storage first: if it fails the gallery stays intact and can be retried.
  const paths: string[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await svc
      .from("photos")
      .select("storage_path")
      .eq("gallery_id", params.id)
      .range(from, from + 999);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    for (const r of data ?? []) paths.push(r.storage_path, thumbPath(r.storage_path));
    if (!data || data.length < 1000) break;
  }
  for (let i = 0; i < paths.length; i += CHUNK) {
    const { error } = await svc.storage.from("photos").remove(paths.slice(i, i + CHUNK));
    if (error) return NextResponse.json({ error: "storage_delete_failed" }, { status: 500 });
  }

  // Print orders are sales records: keep them, just unlink the gallery.
  const { error: oErr } = await svc.from("orders").update({ gallery_id: null }).eq("gallery_id", params.id);
  if (oErr) return NextResponse.json({ error: `orders: ${oErr.message}` }, { status: 500 });

  for (const table of ["photo_favorites", "gallery_views", "photos", "collections"]) {
    const { error } = await svc.from(table).delete().eq("gallery_id", params.id);
    if (error) return NextResponse.json({ error: `${table}: ${error.message}` }, { status: 500 });
  }
  const { error } = await svc.from("galleries").delete().eq("id", params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true, files: paths.length / 2 });
}
