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

export function isExpired(expiresAt: string | null) {
  return !!expiresAt && new Date(expiresAt) < new Date();
}

export function galleryIsOpen(g: { is_active: boolean; expires_at: string | null }) {
  return g.is_active && !isExpired(g.expires_at);
}

export const STORAGE_LIMIT_BYTES = Number(process.env.STORAGE_LIMIT_MB ?? 1024) * 1024 * 1024;

/** Total bytes in the photos bucket (originals + thumbnails), walking folders one level deep. */
export async function storageUsage(svc: Svc): Promise<number> {
  const listAll = async (prefix: string) => {
    const out: { name: string; id: string | null; metadata: Record<string, unknown> | null }[] = [];
    for (let offset = 0; ; offset += PAGE) {
      const { data, error } = await svc.storage.from("photos").list(prefix, { limit: PAGE, offset });
      if (error) throw new Error(error.message);
      out.push(...(data ?? []));
      if (!data || data.length < PAGE) break;
    }
    return out;
  };
  let total = 0;
  const walk = async (prefix: string, depth: number): Promise<void> => {
    const subfolders: string[] = [];
    for (const e of await listAll(prefix)) {
      const size = (e.metadata as { size?: number } | null)?.size;
      if (e.id && typeof size === "number") total += size;
      else if (!e.id && depth < 2) subfolders.push(prefix ? `${prefix}/${e.name}` : e.name);
    }
    for (let i = 0; i < subfolders.length; i += 20) {
      await Promise.all(subfolders.slice(i, i + 20).map((f) => walk(f, depth + 1)));
    }
  };
  await walk("", 0);
  return total;
}
