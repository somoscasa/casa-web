import { NextResponse } from "next/server";
import { ZipWriter } from "@/lib/zip-stream";
import { getServiceSupabase, supabaseConfigured } from "@/lib/supabase/server";
import { fetchAllPhotos, fetchPhotoSizes, splitIntoParts, galleryIsOpen } from "@/lib/gallery-data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const PREFETCH = 6;

function safeName(s: string) {
  return s.replace(/[^a-z0-9-_]+/gi, "_").replace(/^_+|_+$/g, "") || "casa";
}

export async function GET(req: Request, { params }: { params: { token: string } }) {
  if (!supabaseConfigured()) {
    return NextResponse.json({ error: "not_configured" }, { status: 503 });
  }

  const svc = getServiceSupabase();
  const { data: g } = await svc
    .from("galleries")
    .select("id, title, is_active, expires_at, download_permission")
    .eq("access_token", params.token)
    .maybeSingle();

  if (!g || !galleryIsOpen(g)) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  if (g.download_permission === "none") {
    return NextResponse.json({ error: "download_disabled" }, { status: 403 });
  }

  const photos = await fetchAllPhotos(svc, g.id);
  if (photos.length === 0) {
    return NextResponse.json({ error: "empty_gallery" }, { status: 404 });
  }

  const sizes = await fetchPhotoSizes(svc, g.id);
  const { parts, ranges } = splitIntoParts(photos, sizes);

  const url = new URL(req.url);
  if (url.searchParams.has("info")) {
    return NextResponse.json(
      { parts, total: photos.length },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  }

  const partNum = Number(url.searchParams.get("part") ?? "1");
  if (!Number.isInteger(partNum) || partNum < 1 || partNum > parts.length) {
    return NextResponse.json({ error: "bad_part" }, { status: 400 });
  }
  const [from, to] = ranges[partNum - 1];
  const slice = photos.slice(from, to);

  // Names must be unique inside the ZIP; collisions get the photo's position appended.
  const usedNames = new Set<string>();
  const names = slice.map((p, j) => {
    let name = (p.original_filename ?? p.storage_path.split("/").pop() ?? "foto.jpg").replace(/[\\/]/g, "_");
    if (usedNames.has(name.toLowerCase())) {
      const dot = name.lastIndexOf(".");
      const base = dot > 0 ? name.slice(0, dot) : name;
      const ext = dot > 0 ? name.slice(dot) : "";
      name = `${base}_${from + j + 1}${ext}`;
    }
    usedNames.add(name.toLowerCase());
    return name;
  });

  const svcDownload = async (storagePath: string) => {
    // Retries: a transient storage hiccup must not break the ZIP.
    for (let attempt = 0; attempt < 3; attempt++) {
      const { data } = await svc.storage.from("photos").download(storagePath);
      if (data) return new Uint8Array(await data.arrayBuffer());
      await new Promise((r) => setTimeout(r, 800 * (attempt + 1)));
    }
    throw new Error(`photo_unavailable: ${storagePath}`);
  };

  const title = safeName(g.title ?? "casa");
  const filename =
    parts.length > 1
      ? `CASA-${title}-parte-${partNum}-de-${parts.length}.zip`
      : `CASA-${title}.zip`;

  const writer = new ZipWriter();
  const pending = new Map<number, Promise<Uint8Array>>();
  const prefetch = (i: number) => {
    if (i < slice.length && !pending.has(i)) {
      const job = svcDownload(slice[i].storage_path);
      job.catch(() => {}); // surfaced when awaited in order
      pending.set(i, job);
    }
  };
  let idx = 0;

  // Exact byte length lets the browser show progress and time remaining.
  const enc = new TextEncoder();
  const expected = slice.map((p) => sizes.get(p.storage_path));
  const allKnown = expected.every((n) => typeof n === "number");
  const contentLength = allKnown
    ? names.reduce((sum, n, i) => sum + 30 + 46 + 2 * enc.encode(n).length + (expected[i] as number), 0) + 22
    : null;

  const body = new ReadableStream<Uint8Array>({
    async pull(controller) {
      try {
        if (idx >= slice.length) {
          for (const chunk of writer.finish()) controller.enqueue(chunk);
          controller.close();
          return;
        }
        for (let k = 0; k < PREFETCH; k++) prefetch(idx + k);
        const data = await pending.get(idx)!;
        pending.delete(idx);
        if (allKnown && data.length !== expected[idx]) {
          throw new Error(`size_mismatch: ${slice[idx].storage_path}`);
        }
        for (const chunk of writer.file(names[idx], data)) controller.enqueue(chunk);
        idx++;
      } catch (err) {
        console.error(`ZIP ${params.token} part ${partNum} failed at ${idx}`, err);
        controller.error(err);
      }
    },
  });

  return new Response(body, {
    headers: {
      "Content-Type": "application/zip",
      ...(contentLength ? { "Content-Length": String(contentLength) } : {}),
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
