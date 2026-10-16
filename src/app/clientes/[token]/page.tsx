import { notFound } from "next/navigation";
import { getServiceSupabase, supabaseConfigured, batchSignedUrls } from "@/lib/supabase/server";
import { fetchAllPhotos, galleryIsOpen, thumbPath } from "@/lib/gallery-data";
import ClientGallery, {
  type PhotoWithUrl,
  type GalleryCollection,
} from "@/components/clientes/ClientGallery";

export const dynamic = "force-dynamic";

type Params = { token: string };

export default async function ClientGalleryPage(props: { params: Promise<Params> }) {
  const params = await props.params;
  if (!supabaseConfigured()) {
    return (
      <main id="main" className="cl-login">
        <div className="cl-card">
          <div className="wordmark cl-card-mark">CASA</div>
          <h1 className="serif cl-card-title">Próximamente</h1>
          <p className="cl-card-sub">
            Las galerías privadas estarán habilitadas en unos días. Gracias por la paciencia.
          </p>
        </div>
      </main>
    );
  }

  const svc = getServiceSupabase();

  const { data: rawGallery } = await svc
    .from("galleries")
    .select(
      `id, title, is_active, expires_at, download_permission, watermark_enabled,
       clients ( name, email ),
       events ( date, type ),
       collections ( id, name, sort_order )`
    )
    .eq("access_token", params.token)
    .maybeSingle();

  const gallery = rawGallery as unknown as {
    id: string;
    is_active: boolean;
    expires_at: string | null;
    title: string | null;
    download_permission: "none" | "web" | "original";
    watermark_enabled: boolean;
    clients: { name: string | null; email: string } | null;
    events: { date: string | null; type: string | null } | null;
    collections: { id: string; name: string; sort_order: number }[];
  } | null;

  if (!gallery || !galleryIsOpen(gallery)) notFound();

  const sorted = await fetchAllPhotos(svc, gallery.id);

  const [urls, thumbs] = await Promise.all([
    batchSignedUrls(svc, "photos", sorted.map((p) => p.storage_path), 60 * 60 * 24),
    batchSignedUrls(svc, "photos", sorted.map((p) => thumbPath(p.storage_path)), 60 * 60 * 24),
  ]);
  const photos: PhotoWithUrl[] = sorted.map((p, i) => ({
    id: p.id,
    url: urls[i] ?? "",
    thumb: thumbs[i] ?? urls[i] ?? "",
    original_filename: p.original_filename,
    collection_id: p.collection_id,
  }));

  // Only include collections that have at least one photo in this gallery
  const usedCollectionIds = new Set(sorted.map((p) => p.collection_id).filter(Boolean));
  const collections: GalleryCollection[] = (gallery.collections ?? [])
    .filter((c) => usedCollectionIds.has(c.id))
    .sort((a, b) => a.sort_order - b.sort_order);

  const client = gallery.clients;
  const event = gallery.events;

  return (
    <ClientGallery
      token={params.token}
      title={gallery.title ?? client?.name ?? "Tu galería"}
      eventDate={event?.date ?? null}
      photos={photos}
      collections={collections}
      watermarkEnabled={gallery.watermark_enabled ?? false}
      downloadPermission={gallery.download_permission ?? "original"}
    />
  );
}
