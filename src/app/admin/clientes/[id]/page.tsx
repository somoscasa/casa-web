import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getServerSupabase, supabaseConfigured } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/admin";
import AdminTopbar from "@/components/admin/AdminTopbar";
import { formatARS } from "@/lib/gallery-shop";
import {
  isPaid,
  packageName,
  payLabel,
  shipLabel,
  formatDate,
} from "@/lib/crm";

type Params = { id: string };

type Booking = {
  id: string;
  amount_deposit: number | null;
  payment_status: string;
  created_at: string;
};
type EventRow = {
  id: string;
  type: string | null;
  date: string | null;
  package: string | null;
  notes: string | null;
  created_at: string;
  bookings: Booking[] | null;
};
type OrderItem = { name?: string; qty?: number };
type OrderRow = {
  id: string;
  total: number | null;
  payment_status: string;
  shipping_status: string;
  created_at: string;
  items: OrderItem[] | null;
};
type GalleryRow = {
  id: string;
  title: string | null;
  access_token: string;
  is_active: boolean | null;
  created_at: string;
  photos: { count: number }[] | null;
  orders: OrderRow[] | null;
};
type ClientRow = {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
  created_at: string;
  events: EventRow[] | null;
  galleries: GalleryRow[] | null;
};

export default async function ClienteDetail({ params }: { params: Params }) {
  if (!supabaseConfigured()) redirect("/admin");
  const supabase = getServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");
  if (!isAdmin(user.email)) redirect("/admin");

  const { data } = await supabase
    .from("clients")
    .select(
      `id, name, email, phone, created_at,
       events ( id, type, date, package, notes, created_at,
                bookings ( id, amount_deposit, payment_status, created_at ) ),
       galleries ( id, title, access_token, is_active, created_at,
                   photos ( count ),
                   orders ( id, total, payment_status, shipping_status, created_at, items ) )`,
    )
    .eq("id", params.id)
    .single();

  const client = data as unknown as ClientRow | null;
  if (!client) notFound();

  const events = client.events ?? [];
  const galleries = client.galleries ?? [];

  // Flatten all orders across the client's galleries.
  const orders = galleries
    .flatMap((g) =>
      (g.orders ?? []).map((o) => ({
        ...o,
        galleryId: g.id,
        galleryTitle: g.title,
      })),
    )
    .sort((a, b) => b.created_at.localeCompare(a.created_at));

  // Total facturado = señas pagadas + pedidos pagados.
  let facturado = 0;
  for (const ev of events)
    for (const b of ev.bookings ?? [])
      if (isPaid(b.payment_status)) facturado += b.amount_deposit ?? 0;
  for (const o of orders) if (isPaid(o.payment_status)) facturado += o.total ?? 0;

  return (
    <>
      <AdminTopbar email={user.email ?? ""} />
      <main id="main" className="adm-main">
        <div className="wrap">
          <Link href="/admin/clientes" className="label adm-cli-back">
            ← Clientes
          </Link>

          <header className="adm-cli-dhead">
            <h1 className="serif adm-title">{client.name ?? "Sin nombre"}</h1>
            <div className="label adm-cli-contact">
              {client.email}
              {client.phone && ` · ${client.phone}`}
            </div>
            <div className="label adm-cli-since">
              Cliente desde {formatDate(client.created_at)}
            </div>
          </header>

          <div className="adm-cli-summary">
            <div className="adm-cli-tile">
              <span className="serif adm-cli-tile-num">{formatARS(facturado)}</span>
              <span className="label">facturado</span>
            </div>
            <div className="adm-cli-tile">
              <span className="serif adm-cli-tile-num">{events.length}</span>
              <span className="label">eventos</span>
            </div>
            <div className="adm-cli-tile">
              <span className="serif adm-cli-tile-num">{galleries.length}</span>
              <span className="label">galerías</span>
            </div>
            <div className="adm-cli-tile">
              <span className="serif adm-cli-tile-num">{orders.length}</span>
              <span className="label">pedidos</span>
            </div>
          </div>

          {/* Eventos / reservas */}
          <section className="adm-cli-section">
            <h2 className="label adm-cli-sec-title">Eventos y reservas</h2>
            {events.length === 0 ? (
              <p className="serif-italic adm-cli-empty">Sin eventos.</p>
            ) : (
              <ul className="adm-cli-evlist">
                {events.map((ev) => {
                  const b = (ev.bookings ?? [])[0];
                  return (
                    <li key={ev.id} className="adm-cli-ev">
                      <div>
                        <div className="serif adm-cli-ev-title">
                          {ev.type === "boda" ? "Boda" : ev.type ?? "Evento"} ·{" "}
                          {formatDate(ev.date)}
                        </div>
                        <div className="label adm-cli-ev-meta">
                          Paquete {packageName(ev.package)}
                          {ev.notes && ` · ${ev.notes}`}
                        </div>
                      </div>
                      {b && (
                        <div className="adm-cli-ev-pay">
                          <span className="adm-cli-ev-amount">
                            seña {b.amount_deposit ? formatARS(b.amount_deposit) : "—"}
                          </span>
                          <span
                            className={`adm-ped-badge pay-${b.payment_status}`}
                          >
                            {payLabel(b.payment_status)}
                          </span>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          {/* Galerías */}
          <section className="adm-cli-section">
            <h2 className="label adm-cli-sec-title">Galerías</h2>
            {galleries.length === 0 ? (
              <p className="serif-italic adm-cli-empty">Sin galerías.</p>
            ) : (
              <ul className="adm-cli-gallist">
                {galleries.map((g) => (
                  <li key={g.id} className="adm-cli-gal">
                    <div>
                      <div className="serif adm-cli-gal-title">
                        {g.title ?? "Galería"}
                      </div>
                      <div className="label adm-cli-gal-meta">
                        Código {g.access_token} · {g.photos?.[0]?.count ?? 0} fotos ·{" "}
                        {g.is_active ? "activa" : "inactiva"}
                      </div>
                    </div>
                    <div className="adm-cli-gal-actions">
                      <Link
                        href={`/admin/galerias/${g.id}`}
                        className="btn btn-outline adm-row-btn"
                      >
                        Abrir
                      </Link>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Pedidos */}
          <section className="adm-cli-section">
            <h2 className="label adm-cli-sec-title">Pedidos de la tienda</h2>
            {orders.length === 0 ? (
              <p className="serif-italic adm-cli-empty">Sin pedidos.</p>
            ) : (
              <ul className="adm-cli-ordlist">
                {orders.map((o) => (
                  <li key={o.id} className="adm-cli-ord">
                    <div>
                      <div className="serif adm-cli-ord-title">
                        {(o.items ?? []).reduce((n, it) => n + (it.qty ?? 1), 0)}{" "}
                        {(o.items ?? []).length === 1 ? "producto" : "productos"} ·{" "}
                        {formatARS(o.total ?? 0)}
                      </div>
                      <div className="label adm-cli-ord-meta">
                        {formatDate(o.created_at)}
                        {o.galleryTitle && ` · ${o.galleryTitle}`}
                      </div>
                    </div>
                    <div className="adm-cli-ord-badges">
                      <span className={`adm-ped-badge pay-${o.payment_status}`}>
                        {payLabel(o.payment_status)}
                      </span>
                      <span className={`adm-ped-badge ship-${o.shipping_status}`}>
                        {shipLabel(o.shipping_status)}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            {orders.length > 0 && (
              <Link href="/admin/pedidos" className="label adm-cli-allorders">
                Gestionar pedidos →
              </Link>
            )}
          </section>
        </div>
      </main>
    </>
  );
}
