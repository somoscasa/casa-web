import { getServiceSupabase } from "@/lib/supabase/server";
import { STAGE_LABEL, normalizeStage, packageName } from "@/lib/crm";

/**
 * Sync one-way CASA → Notion: empuja los eventos (bodas) a la base "Bodas CASA".
 * Solo de servidor (usa la service role). No-op configurable: si falta
 * NOTION_TOKEN / NOTION_BODAS_DB_ID, se comporta como no configurado.
 */
const NOTION_TOKEN = process.env.NOTION_TOKEN ?? "";
const NOTION_DB_ID = process.env.NOTION_BODAS_DB_ID ?? "";
const NOTION_VERSION = "2022-06-28";
const API = "https://api.notion.com/v1";

export function notionConfigured(): boolean {
  return Boolean(NOTION_TOKEN && NOTION_DB_ID);
}

function headers() {
  return {
    Authorization: `Bearer ${NOTION_TOKEN}`,
    "Notion-Version": NOTION_VERSION,
    "Content-Type": "application/json",
  };
}

type EventRow = {
  id: string;
  type: string | null;
  date: string | null;
  package: string | null;
  status: string | null;
  clients: { name: string | null; email: string; phone: string | null } | null;
};

function typeLabel(t: string | null): string {
  if (t === "boda") return "Boda";
  if (t === "quince") return "Quince";
  return "Otro";
}

/** Propiedades de la página de Notion para un evento. */
function propsFor(e: EventRow): Record<string, unknown> {
  const name = e.clients?.name ?? e.clients?.email ?? "Sin cliente";
  return {
    Nombre: { title: [{ text: { content: name } }] },
    Estado: { select: { name: STAGE_LABEL[normalizeStage(e.status)] } },
    Tipo: { select: { name: typeLabel(e.type) } },
    Fecha: e.date ? { date: { start: e.date } } : { date: null },
    Paquete: e.package
      ? { rich_text: [{ text: { content: packageName(e.package) } }] }
      : { rich_text: [] },
    Email: e.clients?.email ? { email: e.clients.email } : { email: null },
    "Teléfono": e.clients?.phone
      ? { phone_number: e.clients.phone }
      : { phone_number: null },
    "CASA ID": { rich_text: [{ text: { content: e.id } }] },
  };
}

/** Mapa CASA ID → id de página de Notion (para no duplicar). */
async function fetchExistingPages(): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  let cursor: string | undefined;
  do {
    const res = await fetch(`${API}/databases/${NOTION_DB_ID}/query`, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify(
        cursor ? { page_size: 100, start_cursor: cursor } : { page_size: 100 },
      ),
    });
    if (!res.ok) {
      throw new Error(`notion_query_${res.status}: ${await res.text()}`);
    }
    const data = (await res.json()) as {
      results?: {
        id: string;
        properties?: {
          "CASA ID"?: { rich_text?: { plain_text?: string }[] };
        };
      }[];
      has_more?: boolean;
      next_cursor?: string | null;
    };
    for (const page of data.results ?? []) {
      const casaId = page.properties?.["CASA ID"]?.rich_text?.[0]?.plain_text;
      if (casaId) map.set(casaId, page.id);
    }
    cursor = data.has_more ? data.next_cursor ?? undefined : undefined;
  } while (cursor);
  return map;
}

export type NotionSyncResult = {
  synced: number;
  created: number;
  updated: number;
};

/** Empuja todos los eventos de CASA a la base de Notion (upsert por CASA ID). */
export async function syncEventsToNotion(): Promise<NotionSyncResult> {
  if (!notionConfigured()) throw new Error("notion_not_configured");

  const svc = getServiceSupabase();
  const { data, error } = await svc
    .from("events")
    .select(`id, type, date, package, status, clients ( name, email, phone )`);
  if (error) throw new Error(error.message);
  const events = (data as unknown as EventRow[]) ?? [];

  const existing = await fetchExistingPages();
  let created = 0;
  let updated = 0;

  for (const e of events) {
    const properties = propsFor(e);
    const pageId = existing.get(e.id);
    if (pageId) {
      const res = await fetch(`${API}/pages/${pageId}`, {
        method: "PATCH",
        headers: headers(),
        body: JSON.stringify({ properties }),
      });
      if (!res.ok) {
        throw new Error(`notion_update_${res.status}: ${await res.text()}`);
      }
      updated++;
    } else {
      const res = await fetch(`${API}/pages`, {
        method: "POST",
        headers: headers(),
        body: JSON.stringify({
          parent: { database_id: NOTION_DB_ID },
          properties,
        }),
      });
      if (!res.ok) {
        throw new Error(`notion_create_${res.status}: ${await res.text()}`);
      }
      created++;
    }
  }

  return { synced: events.length, created, updated };
}
