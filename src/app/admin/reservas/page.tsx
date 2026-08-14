import { redirect } from "next/navigation";
import { getServerSupabase, supabaseConfigured } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/admin";
import AdminTopbar from "@/components/admin/AdminTopbar";

type Row = {
  id: string;
  amount_deposit: number | null;
  payment_status: string;
  created_at: string;
  events: {
    type: string | null;
    date: string | null;
    package: string | null;
    clients: { name: string | null; email: string } | null;
  } | null;
};

export default async function Reservas() {
  if (!supabaseConfigured()) redirect("/admin");
  const supabase = getServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");
  if (!isAdmin(user.email)) redirect("/admin");

  const { data } = await supabase
    .from("bookings")
    .select(
      `id, amount_deposit, payment_status, created_at,
       events ( type, date, package, clients ( name, email ) )`,
    )
    .order("created_at", { ascending: false })
    .limit(100);
  const rows: Row[] = (data as unknown as Row[]) ?? [];

  return (
    <>
      <AdminTopbar email={user.email ?? ""} />
      <main id="main" className="adm-main">
        <div className="wrap">
          <header className="adm-head">
            <div>
              <div className="label">Admin · Reservas</div>
              <h1 className="serif adm-title">Reservas</h1>
            </div>
          </header>

          {rows.length === 0 ? (
            <div className="adm-empty">
              <p className="serif-italic">Todavía no hay reservas.</p>
            </div>
          ) : (
            <ul className="adm-list">
              {rows.map((r) => {
                const ev = r.events;
                const cli = ev?.clients;
                return (
                  <li key={r.id} className="adm-row">
                    <div>
                      <div className="serif adm-row-title">
                        {cli?.name ?? cli?.email ?? "Sin cliente"}
                      </div>
                      <div className="label adm-row-meta">
                        {ev?.type} ·{" "}
                        {ev?.date
                          ? new Date(ev.date).toLocaleDateString("es-AR")
                          : "sin fecha"}{" "}
                        · {ev?.package ?? "—"} · seña{" "}
                        {r.amount_deposit
                          ? `ARS ${r.amount_deposit.toLocaleString("es-AR")}`
                          : "—"}{" "}
                        · {r.payment_status}
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
