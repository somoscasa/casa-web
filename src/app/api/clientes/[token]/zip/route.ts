import { NextResponse } from "next/server";
import JSZip from "jszip";
import { getServiceSupabase, supabaseConfigured } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BATCH = 20;

export async function GET(
  _req: Request,
  { params }: { params: { token: string } },
) {
  if (!supabaseConfigured()) {
    return NextResponse.json({ error: "not_configured" }, { status: 503 });
  }

  const svc = getServiceSupabase();
  const { data: gallery } = await svc
    .from("galleries")
    .select(
      `id, title, is_active,
       photos ( id, storage_path, original_filename, sort_order )`,
    )
    .eq("access_token", params.token)
    .single();

  const g = gallery as unknown as {
    title: string | null;
    is_active: boolean;
    photos: {
      id: string;
      storage_path: string;
      original_filename: string | null;
      sort_order: number;
    }[];
  } | null;

  if (!g || !g.is_active) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const photos = (g.photos ?? []).sort(
    (a, b) => a.sort_order - b.sort_order,
  );

  if (photos.length === 0) {
    return NextResponse.json({ error: "empty_gallery" }, { status: 404 });
  }

  const zip = new JSZip();
  const usedNames = new Set<string>();

  // Download in batches to limit concurrent memory usage
  for (let i = 0; i < photos.length; i += BATCH) {
    const batch = photos.slice(i, i + BATCH);
    const results = await Promise.all(
      batch.map((p) => svc.storage.from("photos").download(p.storage_path)),
    );
    for (let j = 0; j < batch.length; j++) {
      const { data, error } = results[j];
      if (error || !data) continue;
      const buf = Buffer.from(await data.arrayBuffer());
      let name = batch[j].original_filename ?? batch[j].storage_path.split("/").pop() ?? "foto.jpg";
      while (usedNames.has(name)) {
        const dot = name.lastIndexOf(".");
        const base = dot > 0 ? name.slice(0, dot) : name;
        const ext = dot > 0 ? name.slice(dot) : "";
        name = `${base}_${i + j}${ext}`;
      }
      usedNames.add(name);
      zip.file(name, buf);
    }
  }

  const buf = await zip.generateAsync({ type: "uint8array", streamFiles: true });
  const galleryTitle = g.title ?? "casa";
  const filename = `CASA-${galleryTitle.replace(/[^a-z0-9-_]+/gi, "_")}.zip`;
  const bytes = new Uint8Array(buf.byteLength);
  bytes.set(buf);
  const blob = new Blob([bytes.buffer as ArrayBuffer], { type: "application/zip" });

  return new NextResponse(blob, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
