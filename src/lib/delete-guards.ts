import type { getServiceSupabase } from "@/lib/supabase/server";
import { isPaid } from "@/lib/crm";

type Svc = ReturnType<typeof getServiceSupabase>;

/** Things that a cascade delete would silently destroy; deletion is refused while any exist. */
export async function blockersFor(svc: Svc, by: { clientId?: string; eventId?: string }) {
  const col = by.clientId ? "client_id" : "event_id";
  const id = (by.clientId ?? by.eventId) as string;

  const { count: galleries } = await svc.from("galleries").select("id", { count: "exact", head: true }).eq(col, id);

  let eventIds = by.eventId ? [by.eventId] : [];
  if (by.clientId) {
    const { data } = await svc.from("events").select("id").eq("client_id", by.clientId);
    eventIds = (data ?? []).map((e) => e.id as string);
  }
  let paidBookings = 0;
  if (eventIds.length) {
    const { data } = await svc.from("bookings").select("payment_status").in("event_id", eventIds);
    paidBookings = (data ?? []).filter((b) => isPaid(b.payment_status as string)).length;
  }

  let orders = 0;
  if (by.clientId) {
    const { count } = await svc.from("orders").select("id", { count: "exact", head: true }).eq("client_id", by.clientId);
    orders = count ?? 0;
  }

  return { galleries: galleries ?? 0, paidBookings, orders };
}
