import { redirect } from "next/navigation";
import {
  getServerSupabase,
  getServiceSupabase,
  supabaseConfigured,
} from "@/lib/supabase/server";
import { isAdmin } from "@/lib/admin";
import AdminTopbar from "@/components/admin/AdminTopbar";
import PedidoActions from "@/components/admin/PedidoActions";
import { formatARS } from "@/lib/gallery-shop";

type OrderItem = {
  id: string;
  name: string;
  qty: number;
  price: number;
  kind?: string;
  photo_id?: string | null;
  photo_name?: string | null;
};

type Row = {
  id: string;
  items: OrderItem[] | null;
  total: number | null;
  payment_status: string;
  shipping_status: string;
  created_at: string;
  gallery_id: string | null;
  customer_name: string | null;
  customer_email: string | null;
  customer_phone: string | null;
  shipping_address: { street?: string; city?: string; zip?: string } | null;
  notes: string | null;
  galleries: { title: string | null } | null;
};

const STATUS_LABEL: Record<string, string> = {
  pending: "pendiente",
  paid: "pagado",
  approved: "pagado",
  preparando: "preparando",
  enviado: "enviado",
  entregado: "entregado",
};

export default async function Pedidos() {
  if (!supabaseConfigured()) redirect("/admin");
  const supabase = getServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");
  if (!isAdmin(user.email)) redirect("/admin");

  const { data } = await supabase
    .from("orders")
    .select(
      `id, items, total, payment_status, shipping_status, created_at,
       gallery_id, customer_name, customer_email, customer_phone,
       shipping_address, notes, galleries ( title )`,
    )
    .order("created_at", { ascending: false })
    .limit(100);
  const rows: Row[] = (data as unknown as Row[]) ?? [];

  // Collect photo ids across all order items, sign thumbnails in one pass.
  const photoIds = Array.from(
    new Set(
      rows.flatMap((r) =>
        (r.items ?? []).map((i) => i.photo_id).filter((x): x is string => Boolean(x)),
      ),
    ),
  );

  const thumbs = new Map<string, string>();
  if (photoIds.length > 0) {
    const svc = getServiceSupabase();
    const { data: photoRows } = await svc
      .from("photos")
      .select("id, storage_path")
      .in("id", photoIds);
    await Promise.all(
      (photoRows ?? []).map(async (p: { id: string; storage_path: string }) => {
        const { data: signed } = await svc.storage
          .from("photos")
          .createSignedUrl(p.storage_path, 60 * 60 * 4);
        if (signed?.signedUrl) thumbs.set(p.id, signed.signedUrl);
      }),
    );
  }

  return (
    <>
      <AdminTopbar email={user.email ?? ""} />
      <main id="main" className="adm-main">
        <div className="wrap">
          <header className="adm-head">
            <div>
              <div className="label">Admin · Pedidos</div>
              <h1 className="serif adm-title">Pedidos</h1>
            </div>
            <div className="adm-ped-summary label">
              {rows.length} {rows.length === 1 ? "pedido" : "pedidos"}
            </div>
          </header>

          {rows.length === 0 ? (
            <div className="adm-empty">
              <p className="serif-italic">Todavía no hay pedidos.</p>
            </div>
          ) : (
            <ul className="adm-ped-list">
              {rows.map((r) => {
                const addr = r.shipping_address;
                return (
                  <li key={r.id} className="adm-ped-card">
                    <div className="adm-ped-top">
                      <div>
                        <div className="serif adm-ped-id">
                          Pedido #{r.id.slice(0, 8)}
                        </div>
                        <div className="label adm-ped-date">
                          {new Date(r.created_at).toLocaleDateString("es-AR", {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          })}
                          {r.galleries?.title && ` · ${r.galleries.title}`}
                        </div>
                      </div>
                      <div className="adm-ped-badges">
                        <span className={`adm-ped-badge pay-${r.payment_status}`}>
                          {STATUS_LABEL[r.payment_status] ?? r.payment_status}
                        </span>
                        <span className={`adm-ped-badge ship-${r.shipping_status}`}>
                          {STATUS_LABEL[r.shipping_status] ?? r.shipping_status}
                        </span>
                      </div>
                    </div>

                    {/* Items */}
                    <ul className="adm-ped-items">
                      {(r.items ?? []).map((i, idx) => (
                        <li key={idx} className="adm-ped-item">
                          {i.photo_id && thumbs.get(i.photo_id) ? (
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <img
                              src={thumbs.get(i.photo_id)}
                              alt=""
                              className="adm-ped-thumb"
                            />
                          ) : (
                            <div className="adm-ped-thumb adm-ped-thumb-album serif">
                              {i.kind === "album" ? "Álbum" : "—"}
                            </div>
                          )}
                          <div className="adm-ped-item-body">
                            <div className="adm-ped-item-name">
                              {i.qty}× {i.name}
                            </div>
                            {i.photo_name && (
                              <div className="adm-ped-item-photo">{i.photo_name}</div>
                            )}
                          </div>
                          <div className="adm-ped-item-price">
                            {formatARS(i.price * i.qty)}
                          </div>
                        </li>
                      ))}
                    </ul>

                    <div className="adm-ped-foot">
                      <div className="adm-ped-customer">
                        <div className="adm-ped-cust-name">
                          {r.customer_name ?? "Sin nombre"}
                        </div>
                        <div className="label adm-ped-cust-line">
                          {r.customer_email}
                          {r.customer_phone && ` · ${r.customer_phone}`}
                        </div>
                        {addr && (addr.street || addr.city) && (
                          <div className="label adm-ped-cust-line">
                            {addr.street}
                            {addr.city && `, ${addr.city}`}
                            {addr.zip && ` (${addr.zip})`}
                          </div>
                        )}
                        {r.notes && (
                          <div className="adm-ped-notes">“{r.notes}”</div>
                        )}
                      </div>

                      <div className="adm-ped-right">
                        <div className="adm-ped-total">
                          <span className="label">Total</span>
                          <span className="serif adm-ped-total-num">
                            {formatARS(r.total ?? 0)}
                          </span>
                        </div>
                        <PedidoActions
                          orderId={r.id}
                          shippingStatus={r.shipping_status}
                          paymentStatus={r.payment_status}
                        />
                      </div>
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
