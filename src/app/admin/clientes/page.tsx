import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSupabase, supabaseConfigured } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/admin";
import AdminTopbar from "@/components/admin/AdminTopbar";
import { formatARS } from "@/lib/gallery-shop";
import { isPaid, formatDate, nextEventDate } from "@/lib/crm";

type Booking = { amount_deposit: number | null; payment_status: string | null };
type EventRow = {
  id: string;
  type: string | null;
  date: string | null;
  bookings: Booking[] | null;
};
type OrderRow = { total: number | null; payment_status: string | null };
type GalleryRow = { id: string; is_active: boolean | null; orders: OrderRow[] | null };
type ClientRow = {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
  created_at: string;
  events: EventRow[] | null;
  galleries: GalleryRow[] | null;
};

function aggregate(c: ClientRow) {
  const events = c.events ?? [];
  const galleries = c.galleries ?? [];
  const orders = galleries.flatMap((g) => g.orders ?? []);

  let facturado = 0;
  for (const ev of events) {
    for (const b of ev.bookings ?? []) {
      if (isPaid(b.payment_status)) facturado += b.amount_deposit ?? 0;
    }
  }
  for (const o of orders) {
    if (isPaid(o.payment_status)) facturado += o.total ?? 0;
  }

  return {
    eventos: events.length,
    proxima: nextEventDate(events.map((e) => e.date)),
    galerias: galleries.length,
    pedidos: orders.length,
    facturado,
  };
}

export default async function Clientes() {
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
       events ( id, type, date, bookings ( amount_deposit, payment_status ) ),
       galleries ( id, is_active, orders ( total, payment_status ) )`,
    )
    .order("created_at", { ascending: false })
    .limit(200);

  const clients: ClientRow[] = (data as unknown as ClientRow[]) ?? [];

  return (
    <>
      <AdminTopbar email={user.email ?? ""} />
      <main id="main" className="adm-main">
        <div className="wrap">
          <header className="adm-head">
            <div>
              <div className="label">Admin · Clientes</div>
              <h1 className="serif adm-title">Clientes</h1>
            </div>
            <div className="adm-ped-summary label">
              {clients.length} {clients.length === 1 ? "cliente" : "clientes"}
            </div>
          </header>

          {clients.length === 0 ? (
            <div className="adm-empty">
              <p className="serif-italic">Todavía no hay clientes.</p>
            </div>
          ) : (
            <ul className="adm-cli-list">
              {clients.map((c) => {
                const a = aggregate(c);
                return (
                  <li key={c.id}>
                    <Link href={`/admin/clientes/${c.id}`} className="adm-cli-card">
                      <div className="adm-cli-main">
                        <div className="serif adm-cli-name">
                          {c.name ?? "Sin nombre"}
                        </div>
                        <div className="label adm-cli-contact">
                          {c.email}
                          {c.phone && ` · ${c.phone}`}
                        </div>
                      </div>
                      <div className="adm-cli-stats">
                        <div className="adm-cli-stat">
                          <span className="adm-cli-stat-num serif">
                            {a.proxima ? formatDate(a.proxima) : "—"}
                          </span>
                          <span className="label">próxima boda</span>
                        </div>
                        <div className="adm-cli-stat">
                          <span className="adm-cli-stat-num serif">{a.galerias}</span>
                          <span className="label">galerías</span>
                        </div>
                        <div className="adm-cli-stat">
                          <span className="adm-cli-stat-num serif">{a.pedidos}</span>
                          <span className="label">pedidos</span>
                        </div>
                        <div className="adm-cli-stat">
                          <span className="adm-cli-stat-num serif">
                            {formatARS(a.facturado)}
                          </span>
                          <span className="label">facturado</span>
                        </div>
                      </div>
                    </Link>
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
