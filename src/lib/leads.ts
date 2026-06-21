import { getServiceSupabase } from "@/lib/supabase/server";

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
      { name, email, phone: input.phone?.trim() || null },
      { onConflict: "email" },
    )
    .select("id")
    .single();
  if (cErr || !client) throw new Error(cErr?.message ?? "client_upsert");

  const { data: event, error: eErr } = await svc
    .from("events")
    .insert({
      client_id: client.id,
      type: input.type?.trim().toLowerCase() || null,
      date: input.date || null,
      notes: input.notes?.trim() || null,
      status: "consulta",
    })
    .select("id")
    .single();
  if (eErr || !event) throw new Error(eErr?.message ?? "event_create");

  return { clientId: client.id, eventId: event.id };
}
