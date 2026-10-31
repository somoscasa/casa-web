import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSupabase, getServiceSupabase, supabaseConfigured } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/admin";
import { storageUsage, STORAGE_LIMIT_BYTES, isExpired } from "@/lib/gallery-data";
import GalleryList, { type GalleryListItem } from "@/components/admin/GalleryList";
import AdminTopbar from "@/components/admin/AdminTopbar";
import { formatARS } from "@/lib/gallery-shop";
import {
  isPaid,
  packageName,
  payLabel,
  formatDate,
  normalizeStage, eventTypeLabel, todayAR
} from "@/lib/crm";

export const dynamic = "force-dynamic";

type GalleryRow = {
  id: string;
  title: string | null;
  access_token: string;
  is_active: boolean;
  expires_at: string | null;
  created_at: string;
  clients: { name: string | null; email: string } | null;
  events: { date: string | null; type: string | null } | null;
  photos: { count: number }[];
};

type UpcomingEvent = {
  id: string;
  type: string | null;
  date: string | null;
  package: string | null;
  clients: { name: string | null; email: string } | null;
  bookings: { payment_status: string }[] | null;
};

export default async function AdminHome(props: { searchParams: Promise<{ borrada?: string }> }) {
  const { borrada } = await props.searchParams;
  if (!supabaseConfigured()) {
    return (
      <main id="main" className="cl-login">
        <div className="cl-card">
          <div className="wordmark cl-card-mark">CASA</div>
          <h1 className="serif cl-card-title">Admin</h1>
          <p className="cl-card-sub">
            Falta configurar Supabase. Agregá <code>NEXT_PUBLIC_SUPABASE_URL</code>,{" "}
            <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> y{" "}
            <code>SUPABASE_SERVICE_ROLE_KEY</code> en Vercel.
          </p>
        </div>
      </main>
    );
  }

  const supabase = await getServerSupabase();
  const db = getServiceSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");
  if (!isAdmin(user.email)) {
    return (
      <main id="main" className="cl-login">
        <div className="cl-card">
          <div className="wordmark cl-card-mark">CASA</div>
          <h1 className="serif cl-card-title">Sin acceso</h1>
          <p className="cl-card-sub">
            Tu cuenta no está autorizada como admin.
          </p>
        </div>
      </main>
    );
  }

  const today = todayAR();

  const [galRes, upRes, bookRes, ordRes, cliCntRes, galActiveRes, evStatusRes] =
    await Promise.all([
      db
        .from("galleries")
        .select(
          `id, title, access_token, is_active, expires_at, created_at,
           clients ( name, email ), events ( date, type ), photos ( count )`,
        )
        .order("created_at", { ascending: false })
        .limit(1000),
      db
        .from("events")
        .select(
          `id, type, date, package, clients ( name, email ), bookings ( payment_status )`,
        )
        .gte("date", today)
        .order("date", { ascending: true })
        .limit(6),
      db.from("bookings").select("amount_deposit, payment_status"),
      db.from("orders").select("total, payment_status, shipping_status"),
      db.from("clients").select("id", { count: "exact", head: true }),
      db
        .from("galleries")
        .select("id", { count: "exact", head: true })
        .eq("is_active", true),
      db.from("events").select("status"),
    ]);

  const usedBytes = await storageUsage(db).catch(() => null);
  const usedPct = usedBytes == null ? null : Math.round((usedBytes / STORAGE_LIMIT_BYTES) * 100);
  const galleries: GalleryRow[] = (galRes.data as unknown as GalleryRow[]) ?? [];
  const galleryItems: GalleryListItem[] = galleries.map((g) => ({
    id: g.id,
    title: g.title ?? g.clients?.name ?? g.clients?.email ?? "Galería sin título",
    email: g.clients?.email ?? null,
    code: g.access_token,
    photos: g.photos?.[0]?.count ?? 0,
    active: g.is_active,
    expired: isExpired(g.expires_at),
    eventDate: g.events?.date ?? null,
  }));
  const upcoming: UpcomingEvent[] =
    (upRes.data as unknown as UpcomingEvent[]) ?? [];

  // Total facturado = señas pagadas + pedidos pagados.
  let facturado = 0;
  for (const b of (bookRes.data as { amount_deposit: number | null; payment_status: string }[]) ?? [])
    if (isPaid(b.payment_status)) facturado += b.amount_deposit ?? 0;
  const ordersAll =
    (ordRes.data as { total: number | null; payment_status: string; shipping_status: string }[]) ?? [];
  for (const o of ordersAll) if (isPaid(o.payment_status)) facturado += o.total ?? 0;

  const porPreparar = ordersAll.filter(
    (o) => isPaid(o.payment_status) && o.shipping_status !== "entregado",
  ).length;
  const clientesCount = cliCntRes.count ?? 0;
  const galeriasActivas = galActiveRes.count ?? 0;

  // Consultas activas = leads en el pipeline que todavía no se fotografiaron.
  const evStatuses =
    (evStatusRes.data as { status: string | null }[] | null) ?? [];
  const consultasActivas = evStatuses.filter((e) => {
    const s = normalizeStage(e.status);
    return s === "consulta" || s === "reservada";
  }).length;

  return (
    <>
      <AdminTopbar email={user.email ?? ""} />
      <main id="main" className="adm-main">
        <div className="wrap">
          <header className="adm-head">
            <div>
              <div className="label">Admin · Inicio</div>
              <h1 className="serif adm-title">Panel</h1>
            </div>
            <Link href="/admin/galerias/nueva" className="btn btn-dark">
              Nueva galería
            </Link>
          </header>

          {/* Dashboard */}
          <div className="adm-dash">
            <div className="adm-dash-tiles">
              <div className="adm-dash-tile">
                <span className="serif adm-dash-num">{formatARS(facturado)}</span>
                <span className="label">facturado</span>
              </div>
              <Link href="/admin/embudo" className="adm-dash-tile adm-dash-tile-link">
                <span className="serif adm-dash-num">{consultasActivas}</span>
                <span className="label">consultas activas</span>
              </Link>
              <Link href="/admin/clientes" className="adm-dash-tile adm-dash-tile-link">
                <span className="serif adm-dash-num">{clientesCount}</span>
                <span className="label">clientes</span>
              </Link>
              <div className="adm-dash-tile">
                <span className="serif adm-dash-num">{galeriasActivas}</span>
                <span className="label">galerías activas</span>
              </div>
              {usedBytes != null && usedPct != null && (
                <div
                  className={`adm-dash-tile${usedPct >= 80 ? " adm-dash-warn" : ""}`}
                  title="Espacio de fotos usado en Supabase"
                >
                  <span className="serif adm-dash-num">{usedPct}%</span>
                  <span className="label">
                    espacio usado · {Math.round(usedBytes / 1048576)} MB de{" "}
                    {Math.round(STORAGE_LIMIT_BYTES / 1048576)} MB
                  </span>
                  <span className="adm-meter" aria-hidden>
                    <span style={{ width: `${Math.min(100, usedPct)}%` }} />
                  </span>
                  {usedPct >= 80 && (
                    <span className="adm-dash-warn-text">
                      Casi lleno: borrá galerías viejas o pasá al plan pago.
                    </span>
                  )}
                </div>
              )}
              <Link href="/admin/pedidos" className="adm-dash-tile adm-dash-tile-link">
                <span className="serif adm-dash-num">{porPreparar}</span>
                <span className="label">pedidos por preparar</span>
              </Link>
            </div>

            <div className="adm-dash-upcoming">
              <div className="adm-dash-uphead">
                <h2 className="label adm-cli-sec-title">Próximos eventos</h2>
                <Link href="/admin/calendario" className="cal-dash-link label">
                  Ver calendario →
                </Link>
              </div>
              {upcoming.length === 0 ? (
                <p className="serif-italic adm-cli-empty">
                  No hay eventos próximos agendados.
                </p>
              ) : (
                <ul className="adm-dash-evlist">
                  {upcoming.map((ev) => {
                    const paid = (ev.bookings ?? []).some((b) =>
                      isPaid(b.payment_status),
                    );
                    return (
                      <li key={ev.id} className="adm-dash-ev">
                        <div className="adm-dash-ev-date serif">
                          {formatDate(ev.date)}
                        </div>
                        <div className="adm-dash-ev-body">
                          <div className="adm-dash-ev-name">
                            {ev.clients?.name ?? ev.clients?.email ?? "Sin cliente"}
                          </div>
                          <div className="label adm-dash-ev-meta">
                            {eventTypeLabel(ev.type)} ·{" "}
                            {packageName(ev.package)}
                          </div>
                        </div>
                        <span
                          className={`adm-ped-badge pay-${paid ? "paid" : "pending"}`}
                        >
                          {paid ? "seña paga" : payLabel("pending")}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>

          {/* Galerías */}
          <header className="adm-head adm-head-sub">
            <h2 className="serif adm-subtitle">Galerías</h2>
            {borrada && <span className="adm-status-chip adm-status-active">Galería borrada</span>}
          </header>

          {galRes.error && (
            <p className="cl-err">
              No pudimos cargar las galerías: {galRes.error.message}
            </p>
          )}

          {galleries.length === 0 ? (
            <div className="adm-empty">
              <p className="serif-italic" style={{ fontSize: 24 }}>
                Todavía no creaste ninguna galería.
              </p>
              <Link
                href="/admin/galerias/nueva"
                className="link-arrow"
                style={{ marginTop: 16 }}
              >
                Crear la primera <span className="arr">→</span>
              </Link>
            </div>
          ) : (
            <GalleryList items={galleryItems} />
          )}
        </div>
      </main>
    </>
  );
}
