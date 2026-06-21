import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSupabase, supabaseConfigured } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/admin";
import AdminTopbar from "@/components/admin/AdminTopbar";
import { normalizeStage, STAGE_LABEL, packageName } from "@/lib/crm";

const MESES = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];
const DOW = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

type EventRow = {
  id: string;
  type: string | null;
  date: string | null;
  package: string | null;
  status: string | null;
  clients: { id: string; name: string | null; email: string } | null;
};

const pad = (n: number) => String(n).padStart(2, "0");

function typeLabel(t: string | null): string {
  if (!t) return "Evento";
  if (t === "boda") return "Boda";
  return t.charAt(0).toUpperCase() + t.slice(1);
}

export default async function Calendario({
  searchParams,
}: {
  searchParams: { m?: string };
}) {
  if (!supabaseConfigured()) redirect("/admin");
  const supabase = getServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");
  if (!isAdmin(user.email)) redirect("/admin");

  // "Hoy" en UTC, consistente con el resto del admin.
  const todayKey = new Date().toISOString().slice(0, 10);
  const defaultYM = todayKey.slice(0, 7);

  const raw = searchParams.m;
  const ym = typeof raw === "string" && /^\d{4}-\d{2}$/.test(raw) ? raw : defaultYM;
  let year = Number(ym.slice(0, 4));
  let month = Number(ym.slice(5, 7)); // 1-12
  if (!Number.isInteger(month) || month < 1 || month > 12) {
    year = Number(defaultYM.slice(0, 4));
    month = Number(defaultYM.slice(5, 7));
  }

  const lastDay = new Date(year, month, 0).getDate();
  const monthStart = `${year}-${pad(month)}-01`;
  const monthEnd = `${year}-${pad(month)}-${pad(lastDay)}`;

  const { data } = await supabase
    .from("events")
    .select(`id, type, date, package, status, clients ( id, name, email )`)
    .gte("date", monthStart)
    .lte("date", monthEnd)
    .order("date", { ascending: true });
  const events = (data as unknown as EventRow[]) ?? [];

  // Ubicar eventos por día (comparación directa de strings YYYY-MM-DD).
  const byDay = new Map<string, EventRow[]>();
  for (const e of events) {
    if (!e.date) continue;
    const k = e.date.slice(0, 10);
    const arr = byDay.get(k);
    if (arr) arr.push(e);
    else byDay.set(k, [e]);
  }

  // Grilla con semanas que empiezan en lunes.
  const firstDow = (new Date(year, month - 1, 1).getDay() + 6) % 7; // 0=Lun … 6=Dom
  const cells: ({ day: number; key: string } | null)[] = [];
  for (let i = 0; i < firstDow; i++) cells.push(null);
  for (let d = 1; d <= lastDay; d++) {
    cells.push({ day: d, key: `${year}-${pad(month)}-${pad(d)}` });
  }
  while (cells.length % 7 !== 0) cells.push(null);

  const prevYM = month === 1 ? `${year - 1}-12` : `${year}-${pad(month - 1)}`;
  const nextYM = month === 12 ? `${year + 1}-01` : `${year}-${pad(month + 1)}`;
  const isCurrentMonth = ym === defaultYM;

  return (
    <>
      <AdminTopbar email={user.email ?? ""} />
      <main className="adm-main">
        <div className="wrap">
          <header className="adm-head">
            <div>
              <div className="label">Admin · Calendario</div>
              <h1 className="serif adm-title">Calendario de bodas</h1>
            </div>
            <div className="cal-nav">
              <Link
                href={`/admin/calendario?m=${prevYM}`}
                className="cal-navbtn"
                aria-label="Mes anterior"
              >
                ←
              </Link>
              {!isCurrentMonth && (
                <Link href="/admin/calendario" className="cal-today-link label">
                  Hoy
                </Link>
              )}
              <Link
                href={`/admin/calendario?m=${nextYM}`}
                className="cal-navbtn"
                aria-label="Mes siguiente"
              >
                →
              </Link>
            </div>
          </header>

          <div className="cal-monthbar">
            <h2 className="serif cal-month">
              {MESES[month - 1]} {year}
            </h2>
            <span className="label cal-count">
              {events.length}{" "}
              {events.length === 1 ? "evento" : "eventos"}
            </span>
          </div>

          <div className="cal-grid" role="grid">
            {DOW.map((d) => (
              <div key={d} className="cal-dow label">
                {d}
              </div>
            ))}
            {cells.map((cell, i) => {
              if (!cell) return <div key={`e${i}`} className="cal-cell cal-cell-empty" />;
              const evs = byDay.get(cell.key) ?? [];
              const isToday = cell.key === todayKey;
              return (
                <div
                  key={cell.key}
                  className={`cal-cell${isToday ? " cal-cell-today" : ""}`}
                >
                  <div className="cal-daynum">{cell.day}</div>
                  <div className="cal-evs">
                    {evs.map((e) => {
                      const stage = normalizeStage(e.status);
                      const name =
                        e.clients?.name ?? e.clients?.email ?? "Sin cliente";
                      const title = `${typeLabel(e.type)} · ${STAGE_LABEL[stage]}${
                        e.package ? ` · ${packageName(e.package)}` : ""
                      }`;
                      const chip = (
                        <span className={`cal-ev cal-ev-${stage}`} title={title}>
                          {name}
                        </span>
                      );
                      return e.clients?.id ? (
                        <Link
                          key={e.id}
                          href={`/admin/clientes/${e.clients.id}`}
                          className="cal-ev-link"
                        >
                          {chip}
                        </Link>
                      ) : (
                        <span key={e.id} className="cal-ev-link">
                          {chip}
                        </span>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="cal-legend">
            {(["consulta", "reservada", "fotografiada", "entregada"] as const).map(
              (s) => (
                <span key={s} className="cal-legend-item">
                  <span className={`cal-dot cal-ev-${s}`} />
                  <span className="label">{STAGE_LABEL[s]}</span>
                </span>
              ),
            )}
          </div>
        </div>
      </main>
    </>
  );
}
