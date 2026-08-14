import { notFound } from "next/navigation";
import { getServiceSupabase, supabaseConfigured } from "@/lib/supabase/server";
import ClientGallery, {
  type PhotoWithUrl,
  type GalleryCollection,
} from "@/components/clientes/ClientGallery";

type Params = { token: string };

export default async function ClientGalleryPage({ params }: { params: Params }) {
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
       photos ( id, storage_path, original_filename, sort_order, collection_id ),
       collections ( id, name, sort_order )`
    )
    .eq("access_token", params.token)
    .single();

  const gallery = rawGallery as unknown as {
    id: string;
    is_active: boolean;
    expires_at: string | null;
    title: string | null;
    download_permission: "none" | "web" | "original";
    watermark_enabled: boolean;
    clients: { name: string | null; email: string } | null;
    events: { date: string | null; type: string | null } | null;
    photos: {
      id: string;
      storage_path: string;
      original_filename: string | null;
      sort_order: number;
      collection_id: string | null;
    }[];
    collections: { id: string; name: string; sort_order: number }[];
  } | null;

  if (!gallery || !gallery.is_active) notFound();

  // Check expiry server-side
  if (gallery.expires_at && new Date(gallery.expires_at) < new Date()) notFound();

  const rawPhotos = gallery.photos ?? [];
  const sorted = [...rawPhotos].sort((a, b) => a.sort_order - b.sort_order);

  const photos: PhotoWithUrl[] = await Promise.all(
    sorted.map(async (p) => {
      const { data } = await svc.storage
        .from("photos")
        .createSignedUrl(p.storage_path, 60 * 60 * 8);
      return {
        id: p.id,
        url: data?.signedUrl ?? "",
        original_filename: p.original_filename,
        collection_id: p.collection_id,
      };
    })
  );

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
