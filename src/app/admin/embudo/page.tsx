import { redirect } from "next/navigation";
import { getServerSupabase, supabaseConfigured } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/admin";
import AdminTopbar from "@/components/admin/AdminTopbar";
import NewLeadForm from "@/components/admin/NewLeadForm";
import LeadCard, { type Lead } from "@/components/admin/LeadCard";
import { PIPELINE, STAGE_LABEL, normalizeStage, isPaid } from "@/lib/crm";

type Booking = { amount_deposit: number | null; payment_status: string | null };
type EventRow = {
  id: string;
  type: string | null;
  date: string | null;
  package: string | null;
  status: string | null;
  notes: string | null;
  clients: { id: string; name: string | null; email: string } | null;
  bookings: Booking[] | null;
};

export default async function Embudo() {
  if (!supabaseConfigured()) redirect("/admin");
  const supabase = getServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");
  if (!isAdmin(user.email)) redirect("/admin");

  const { data } = await supabase
    .from("events")
    .select(
      `id, type, date, package, status, notes,
       clients ( id, name, email ),
       bookings ( amount_deposit, payment_status )`,
    )
    .order("date", { ascending: true, nullsFirst: false })
    .limit(300);

  const rows: EventRow[] = (data as unknown as EventRow[]) ?? [];

  const leads: Lead[] = rows.map((e) => {
    const bookings = e.bookings ?? [];
    const paid = bookings.some((b) => isPaid(b.payment_status));
    const deposit = bookings[0]?.amount_deposit ?? null;
    return {
      id: e.id,
      clientId: e.clients?.id ?? null,
      name: e.clients?.name ?? e.clients?.email ?? "Sin cliente",
      type: e.type,
      date: e.date,
      package: e.package,
      status: e.status ?? "consulta",
      notes: e.notes,
      deposit,
      paid,
    };
  });

  const byStage = (stage: string) =>
    leads.filter((l) => normalizeStage(l.status) === stage);
  const perdidas = byStage("perdida");

  return (
    <>
      <AdminTopbar email={user.email ?? ""} />
      <main className="adm-main">
        <div className="wrap">
          <header className="adm-head">
            <div>
              <div className="label">Admin · Embudo</div>
              <h1 className="serif adm-title">Embudo de reservas</h1>
            </div>
            <NewLeadForm />
          </header>

          {leads.length === 0 ? (
            <div className="adm-empty">
              <p className="serif-italic">Todavía no hay consultas.</p>
            </div>
          ) : (
            <div className="emb-board">
              {PIPELINE.map((stage) => {
                const col = byStage(stage);
                return (
                  <section key={stage} className="emb-col">
                    <div className="emb-col-head">
                      <span className="label emb-col-title">
                        {STAGE_LABEL[stage]}
                      </span>
                      <span className="emb-col-count">{col.length}</span>
                    </div>
                    <div className="emb-col-body">
                      {col.length === 0 ? (
                        <p className="serif-italic emb-col-empty">—</p>
                      ) : (
                        col.map((l) => <LeadCard key={l.id} lead={l} />)
                      )}
                    </div>
                  </section>
                );
              })}
            </div>
          )}

          {perdidas.length > 0 && (
            <section className="emb-perdidas">
              <h2 className="label adm-cli-sec-title">
                Perdidas · {perdidas.length}
              </h2>
              <div className="emb-perdidas-grid">
                {perdidas.map((l) => (
                  <LeadCard key={l.id} lead={l} />
                ))}
              </div>
            </section>
          )}
        </div>
      </main>
    </>
  );
}
