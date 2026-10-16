import type { getServiceSupabase } from "@/lib/supabase/server";

type Svc = ReturnType<typeof getServiceSupabase>;

export type PhotoRow = {
  id: string;
  storage_path: string;
  original_filename: string | null;
  sort_order: number;
  collection_id: string | null;
};

const PAGE = 1000;

/** Light preview stored next to the untouched original; grids show this, downloads never do. */
export function thumbPath(storagePath: string) {
  return `thumbs/${storagePath}`;
}

/** Supabase returns at most 1000 rows per request, so read in pages. */
export async function fetchAllPhotos(svc: Svc, galleryId: string): Promise<PhotoRow[]> {
  const all: PhotoRow[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await svc
      .from("photos")
      .select("id, storage_path, original_filename, sort_order, collection_id")
      .eq("gallery_id", galleryId)
      .order("sort_order", { ascending: true })
      .order("id", { ascending: true })
      .range(from, from + PAGE - 1);
    if (error) throw new Error(error.message);
    all.push(...((data ?? []) as PhotoRow[]));
    if (!data || data.length < PAGE) break;
  }
  return all;
}

/** File sizes (bytes) keyed by storage path, read from the storage folder listing. */
export async function fetchPhotoSizes(svc: Svc, galleryId: string): Promise<Map<string, number>> {
  const sizes = new Map<string, number>();
  for (let offset = 0; ; offset += PAGE) {
    const { data, error } = await svc.storage
      .from("photos")
      .list(galleryId, { limit: PAGE, offset, sortBy: { column: "name", order: "asc" } });
    if (error) throw new Error(error.message);
    for (const f of data ?? []) {
      const size = (f.metadata as { size?: number } | null)?.size;
      if (typeof size === "number") sizes.set(`${galleryId}/${f.name}`, size);
    }
    if (!data || data.length < PAGE) break;
  }
  return sizes;
}

export type ZipPart = { part: number; from: number; to: number; count: number; bytes: number };

export const ZIP_PART_BYTES = 200 * 1024 * 1024;
const FALLBACK_PHOTO_BYTES = 8 * 1024 * 1024;

/** Split photos (already in gallery order) into consecutive parts of at most ZIP_PART_BYTES. */
export function splitIntoParts(photos: PhotoRow[], sizes: Map<string, number>): { parts: ZipPart[]; ranges: [number, number][] } {
  const parts: ZipPart[] = [];
  const ranges: [number, number][] = [];
  let start = 0;
  let bytes = 0;
  photos.forEach((p, i) => {
    const s = sizes.get(p.storage_path) ?? FALLBACK_PHOTO_BYTES;
    if (i > start && bytes + s > ZIP_PART_BYTES) {
      ranges.push([start, i]);
      parts.push({ part: parts.length + 1, from: start + 1, to: i, count: i - start, bytes });
      start = i;
      bytes = 0;
    }
    bytes += s;
  });
  if (photos.length > start) {
    ranges.push([start, photos.length]);
    parts.push({ part: parts.length + 1, from: start + 1, to: photos.length, count: photos.length - start, bytes });
  }
  return { parts, ranges };
}

export function galleryIsOpen(g: { is_active: boolean; expires_at: string | null }) {
  if (!g.is_active) return false;
  if (g.expires_at && new Date(g.expires_at) < new Date()) return false;
  return true;
}
