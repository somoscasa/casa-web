import { getServiceSupabase } from "@/lib/supabase/server";
import { normalizeEventType } from "@/lib/crm";

export type LeadInput = {
  name: string;
  email: string;
  phone?: string | null;
  type?: string | null; // 'boda' | 'otro' | … (se guarda en minúsculas)
  date?: string | null; // YYYY-MM-DD
  notes?: string | null;
};

/**
 * Alta de un lead en el embudo: upsert del cliente (por email) + creación de un
 * evento en estado 'consulta'. Usa la service role, así que es solo de servidor.
 * Devuelve los ids creados o lanza Error.
 */
export async function createLead(
  input: LeadInput,
): Promise<{ clientId: string; eventId: string }> {
  const svc = getServiceSupabase();
  const email = input.email.trim().toLowerCase();
  const name = input.name.trim();

  const { data: client, error: cErr } = await svc
    .from("clients")
    .upsert(
      input.phone?.trim()
        ? { name, email, phone: input.phone.trim() }
        : { name, email },
      { onConflict: "email" },
    )
    .select("id")
    .single();
  if (cErr || !client) throw new Error(cErr?.message ?? "client_upsert");

  const type = normalizeEventType(input.type);
  const base = {
    client_id: client.id,
    date: input.date || null,
    notes: input.notes?.trim() || null,
    status: "consulta",
  };
  let { data: event, error: eErr } = await svc
    .from("events")
    .insert({ ...base, type })
    .select("id")
    .single();
  // The DB may only allow some types: never lose an inquiry over it, keep the type in the notes.
  if (eErr?.code === "23514") {
    const note = `Tipo: ${input.type?.trim() || "sin especificar"}`;
    ({ data: event, error: eErr } = await svc
      .from("events")
      .insert({ ...base, type: null, notes: base.notes ? `${note}\n${base.notes}` : note })
      .select("id")
      .single());
  }
  if (eErr || !event) throw new Error(eErr?.message ?? "event_create");

  return { clientId: client.id, eventId: event.id };
}
