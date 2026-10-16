import { NextResponse } from "next/server";
import { getServerSupabase, getServiceSupabase, supabaseConfigured } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/admin";
import { thumbPath } from "@/lib/gallery-data";

export const dynamic = "force-dynamic";

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string; photoId: string } },
) {
  if (!supabaseConfigured()) return NextResponse.json({ error: "not_configured" }, { status: 503 });

  const supabase = getServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !isAdmin(user.email)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const svc = getServiceSupabase();

  // Get photo to find storage path
  const { data: photo } = await svc
    .from("photos")
    .select("id, storage_path, gallery_id")
    .eq("id", params.photoId)
    .eq("gallery_id", params.id)
    .single();

  if (!photo) return NextResponse.json({ error: "not_found" }, { status: 404 });

  // Delete from storage
  await svc.storage.from("photos").remove([photo.storage_path, thumbPath(photo.storage_path)]);

  // Delete from DB (cascade handles favorites etc.)
  const { error } = await svc.from("photos").delete().eq("id", params.photoId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
