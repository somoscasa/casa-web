import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSupabase, supabaseConfigured } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/admin";
import AdminTopbar from "@/components/admin/AdminTopbar";
import { formatARS } from "@/lib/gallery-shop";
import {
  isPaid,
  packageName,
  payLabel,
  formatDate,
  normalizeStage,
} from "@/lib/crm";

type GalleryRow = {
  id: string;
  title: string | null;
  access_token: string;
  is_active: boolean;
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

export default async function AdminHome() {
  if (!supabaseConfigured()) {
    return (
      <main className="cl-login">
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

  const supabase = getServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");
  if (!isAdmin(user.email)) {
    return (
      <main className="cl-login">
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

  const today = new Date().toISOString().slice(0, 10);

  const [galRes, upRes, bookRes, ordRes, cliCntRes, galActiveRes, evStatusRes] =
    await Promise.all([
      supabase
        .from("galleries")
        .select(
          `id, title, access_token, is_active, created_at,
           clients ( name, email ), events ( date, type ), photos ( count )`,
        )
        .order("created_at", { ascending: false })
        .limit(50),
      supabase
        .from("events")
        .select(
          `id, type, date, package, clients ( name, email ), bookings ( payment_status )`,
        )
        .gte("date", today)
        .order("date", { ascending: true })
        .limit(6),
      supabase.from("bookings").select("amount_deposit, payment_status"),
      supabase.from("orders").select("total, payment_status, shipping_status"),
      supabase.from("clients").select("id", { count: "exact", head: true }),
      supabase
        .from("galleries")
        .select("id", { count: "exact", head: true })
        .eq("is_active", true),
      supabase.from("events").select("status"),
    ]);

  const galleries: GalleryRow[] = (galRes.data as unknown as GalleryRow[]) ?? [];
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
      <main className="adm-main">
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
              <Link href="/admin/pedidos" className="adm-dash-tile adm-dash-tile-link">
                <span className="serif adm-dash-num">{porPreparar}</span>
                <span className="label">pedidos por preparar</span>
              </Link>
            </div>

            <div className="adm-dash-upcoming">
              <div className="adm-dash-uphead">
                <h2 className="label adm-cli-sec-title">Próximas bodas</h2>
                <Link href="/admin/calendario" className="cal-dash-link label">
                  Ver calendario →
                </Link>
              </div>
              {upcoming.length === 0 ? (
                <p className="serif-italic adm-cli-empty">
                  No hay bodas próximas agendadas.
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
                            {ev.type === "boda" ? "Boda" : ev.type ?? "Evento"} ·{" "}
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
            <ul className="adm-list">
              {galleries.map((g) => {
                const count = g.photos?.[0]?.count ?? 0;
                return (
                  <li key={g.id} className="adm-row">
                    <div>
                      <div className="serif adm-row-title">
                        {g.title ??
                          g.clients?.name ??
                          g.clients?.email ??
                          "Galería sin título"}
                      </div>
                      <div className="label adm-row-meta">
                        {g.clients?.email} · {count} fotos ·{" "}
                        {g.is_active ? "activa" : "pausada"}
                      </div>
                    </div>
                    <div className="adm-row-actions">
                      <Link
                        href={`/clientes/${g.access_token}`}
                        target="_blank"
                        className="link-arrow"
                      >
                        Ver galería <span className="arr">→</span>
                      </Link>
                      <Link
                        href={`/admin/galerias/${g.id}`}
                        className="btn btn-outline adm-row-btn"
                      >
                        Editar
                      </Link>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </main>
    </>
  );
}
