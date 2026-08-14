import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getServerSupabase, getServiceSupabase, supabaseConfigured } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/admin";
import AdminTopbar from "@/components/admin/AdminTopbar";
import GalleryUploader from "@/components/admin/GalleryUploader";
import AdminPhotoGrid, { type AdminPhoto } from "@/components/admin/AdminPhotoGrid";
import AdminGallerySettings from "@/components/admin/AdminGallerySettings";
import AdminCollections from "@/components/admin/AdminCollections";
import SendGalleryButton from "@/components/admin/SendGalleryButton";

type Params = { id: string };

export default async function GalleryDetail({ params }: { params: Params }) {
  if (!supabaseConfigured()) redirect("/admin");
  const supabase = getServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");
  if (!isAdmin(user.email)) redirect("/admin");

  const svc = getServiceSupabase();

  // Parallel fetches
  const [galleryRes, photosRes, favRes, collsRes, viewsRes, lastViewRes] = await Promise.all([
    svc
      .from("galleries")
      .select(
        `id, title, access_token, is_active, expires_at, download_permission,
         watermark_enabled, notification_sent_at,
         clients ( name, email ),
         events ( date, type )`
      )
      .eq("id", params.id)
      .single(),
    svc
      .from("photos")
      .select("id, storage_path, original_filename, sort_order, collection_id")
      .eq("gallery_id", params.id)
      .order("sort_order", { ascending: true }),
    svc.from("photo_favorites").select("photo_id").eq("gallery_id", params.id),
    svc
      .from("collections")
      .select("id, name, sort_order")
      .eq("gallery_id", params.id)
      .order("sort_order", { ascending: true }),
    svc
      .from("gallery_views")
      .select("*", { count: "exact", head: true })
      .eq("gallery_id", params.id),
    svc
      .from("gallery_views")
      .select("viewed_at")
      .eq("gallery_id", params.id)
      .order("viewed_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  if (!galleryRes.data) notFound();

  const g = galleryRes.data as unknown as {
    id: string;
    title: string | null;
    access_token: string;
    is_active: boolean;
    expires_at: string | null;
    download_permission: "none" | "web" | "original";
    watermark_enabled: boolean;
    notification_sent_at: string | null;
    clients: { name: string | null; email: string } | null;
    events: { date: string | null; type: string | null } | null;
  };

  const rawPhotos = (photosRes.data ?? []) as {
    id: string;
    storage_path: string;
    original_filename: string | null;
    sort_order: number;
    collection_id: string | null;
  }[];

  // Build favorites count map
  const favMap: Record<string, number> = {};
  for (const f of (favRes.data ?? []) as { photo_id: string }[]) {
    favMap[f.photo_id] = (favMap[f.photo_id] ?? 0) + 1;
  }

  // Generate signed URLs for thumbnails
  const photos: AdminPhoto[] = await Promise.all(
    rawPhotos.map(async (p) => {
      const { data } = await svc.storage
        .from("photos")
        .createSignedUrl(p.storage_path, 60 * 60 * 4);
      return {
        id: p.id,
        url: data?.signedUrl ?? "",
        original_filename: p.original_filename,
        sort_order: p.sort_order,
        collection_id: p.collection_id,
        favorites_count: favMap[p.id] ?? 0,
      };
    })
  );

  const collections = (collsRes.data ?? []) as { id: string; name: string; sort_order: number }[];
  const viewCount = viewsRes.count ?? 0;
  const lastViewed = (lastViewRes.data as { viewed_at: string } | null)?.viewed_at ?? null;

  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? "https://casa-web-chi.vercel.app";
  const clientLink = `${origin}/clientes/${g.access_token}`;
  const client = g.clients;
  const displayTitle = g.title ?? client?.name ?? "Sin título";
  const favTotal = Object.values(favMap).reduce((s, n) => s + n, 0);

  return (
    <>
      <AdminTopbar email={user.email ?? ""} />
      <main id="main" className="adm-main">
        <div className="wrap">
          <Link href="/admin" className="link-arrow" style={{ marginBottom: 20 }}>
            ← Todas las galerías
          </Link>

          {/* Header */}
          <header className="adm-head" style={{ marginTop: 20 }}>
            <div>
              <div className="label">Galería</div>
              <h1 className="serif adm-title">{displayTitle}</h1>
              <p className="label" style={{ marginTop: 8 }}>
                {client?.email}
                {g.is_active ? (
                  <span className="adm-status-chip adm-status-active">Activa</span>
                ) : (
                  <span className="adm-status-chip adm-status-inactive">Inactiva</span>
                )}
                {g.expires_at && new Date(g.expires_at) < new Date() && (
                  <span className="adm-status-chip adm-status-expired">Expirada</span>
                )}
              </p>
            </div>
          </header>

          {/* Stats row */}
          <div className="adm-stats-row">
            <div className="adm-stat">
              <div className="adm-stat-num">{photos.length}</div>
              <div className="label">Fotos</div>
            </div>
            <div className="adm-stat">
              <div className="adm-stat-num">{viewCount}</div>
              <div className="label">Visitas</div>
            </div>
            <div className="adm-stat">
              <div className="adm-stat-num">{favTotal}</div>
              <div className="label">Favoritos</div>
            </div>
            <div className="adm-stat">
              <div className="adm-stat-num">{collections.length}</div>
              <div className="label">Colecciones</div>
            </div>
            {lastViewed && (
              <div className="adm-stat">
                <div className="adm-stat-num adm-stat-date">
                  {new Date(lastViewed).toLocaleDateString("es-AR", {
                    day: "numeric",
                    month: "short",
                  })}
                </div>
                <div className="label">Última visita</div>
              </div>
            )}
          </div>

          {/* Code box + send button */}
          <div className="adm-code-send">
            <section className="adm-code-box" style={{ flex: 1 }}>
              <div className="label">Código de acceso del cliente</div>
              <div className="adm-code">{g.access_token}</div>
              <p className="adm-code-hint">
                El cliente lo ingresa en{" "}
                <a href={`${origin}/clientes`} target="_blank" rel="noopener noreferrer">
                  {origin.replace(/^https?:\/\//, "")}/clientes
                </a>
              </p>
              <details className="adm-code-link">
                <summary>O mandá el link directo</summary>
                <div className="adm-link-copy">
                  <code>{clientLink}</code>
                </div>
              </details>
            </section>

            {client?.email && (
              <SendGalleryButton
                galleryId={params.id}
                clientEmail={client.email}
                clientName={client.name}
                alreadySent={!!g.notification_sent_at}
              />
            )}
          </div>

          {/* Collections */}
          <AdminCollections galleryId={params.id} initial={collections} />

          {/* Photo uploader */}
          <GalleryUploader galleryId={params.id} existingCount={photos.length} />

          {/* Photo grid with drag & drop */}
          <AdminPhotoGrid
            galleryId={params.id}
            initialPhotos={photos}
            collections={collections}
          />

          {/* Settings */}
          <AdminGallerySettings
            galleryId={params.id}
            initial={{
              title: g.title ?? "",
              is_active: g.is_active,
              expires_at: g.expires_at,
              download_permission: g.download_permission ?? "original",
              watermark_enabled: g.watermark_enabled ?? false,
            }}
          />
        </div>
      </main>
    </>
  );
}
