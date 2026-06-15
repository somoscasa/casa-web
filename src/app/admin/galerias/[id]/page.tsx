import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getServerSupabase, supabaseConfigured } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/admin";
import AdminTopbar from "@/components/admin/AdminTopbar";
import GalleryUploader from "@/components/admin/GalleryUploader";

type Params = { id: string };

export default async function GalleryDetail({
  params,
}: {
  params: Params;
}) {
  if (!supabaseConfigured()) redirect("/admin");
  const supabase = getServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");
  if (!isAdmin(user.email)) redirect("/admin");

  const { data: gallery } = await supabase
    .from("galleries")
    .select(
      `id, title, access_token, is_active,
       clients ( name, email ),
       events ( date, type ),
       photos ( id, storage_path, original_filename, sort_order )`,
    )
    .eq("id", params.id)
    .single();

  if (!gallery) notFound();

  const g = gallery as unknown as {
    title: string | null;
    access_token: string;
    clients: { name: string | null; email: string } | null;
    photos: {
      id: string;
      storage_path: string;
      original_filename: string | null;
      sort_order: number;
    }[];
  };
  const photos = g.photos ?? [];

  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? "https://casa-web-chi.vercel.app";
  const clientLink = `${origin}/clientes/${g.access_token}`;

  const client = g.clients;

  return (
    <>
      <AdminTopbar email={user.email ?? ""} />
      <main className="adm-main">
        <div className="wrap">
          <Link href="/admin" className="link-arrow" style={{ marginBottom: 20 }}>
            ← Todas las galerías
          </Link>

          <header className="adm-head" style={{ marginTop: 20 }}>
            <div>
              <div className="label">Galería</div>
              <h1 className="serif adm-title">
                {g.title ?? client?.name ?? "Sin título"}
              </h1>
              <p className="label" style={{ marginTop: 8 }}>
                {client?.email} · {photos.length} fotos
              </p>
            </div>
          </header>

          <section className="adm-code-box">
            <div className="label">Código privado de tu cliente</div>
            <div className="adm-code">{g.access_token}</div>
            <p className="adm-code-hint">
              Compartilo con tu cliente. Lo ingresa en{" "}
              <a
                href={`${origin}/clientes`}
                target="_blank"
                rel="noopener noreferrer"
              >
                {origin.replace(/^https?:\/\//, "")}/clientes
              </a>
              .
            </p>
            <details className="adm-code-link">
              <summary>O mandale el link directo</summary>
              <div className="adm-link-copy">
                <code>{clientLink}</code>
              </div>
            </details>
          </section>

          <GalleryUploader galleryId={params.id} existingCount={photos.length} />

          <section style={{ marginTop: 56 }}>
            <div className="label" style={{ marginBottom: 20 }}>
              Fotos cargadas
            </div>
            {photos.length === 0 ? (
              <p className="serif-italic" style={{ color: "var(--ceniza)" }}>
                Todavía no hay fotos. Subí las primeras arriba.
              </p>
            ) : (
              <div className="adm-photo-grid">
                {photos.map((p) => (
                  <div key={p.id} className="adm-photo-cell">
                    <span className="label">{p.original_filename ?? p.storage_path}</span>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
    </>
  );
}
