import { createHash } from "crypto";
import type { getServiceSupabase } from "@/lib/supabase/server";

type Svc = ReturnType<typeof getServiceSupabase>;

export const LIMITS = {
  // Wrong gallery codes per visitor: blocks guessing, a real couple never gets near it.
  code: { max: 10, minutes: 15 },
  // Contact / reservation messages per visitor.
  contact: { max: 5, minutes: 60 },
} as const;

export type LimitKind = keyof typeof LIMITS;

/** Visitor key: hashed IP (Vercel sets x-forwarded-for / x-real-ip). Never stored raw. */
export function visitorKey(h: Headers) {
  const ip = (h.get("x-forwarded-for") ?? "").split(",")[0].trim() || h.get("x-real-ip") || "unknown";
  return createHash("sha256").update(ip).digest("hex").slice(0, 24);
}

/** True when the visitor already used up the allowance. Fails open if the table is missing. */
export async function isLimited(svc: Svc, kind: LimitKind, key: string) {
  const { max, minutes } = LIMITS[kind];
  const since = new Date(Date.now() - minutes * 60_000).toISOString();
  const { count, error } = await svc
    .from("rate_events")
    .select("id", { count: "exact", head: true })
    .eq("kind", kind)
    .eq("key", key)
    .gte("created_at", since);
  if (error) {
    console.error("[rate-limit] check failed:", error.message);
    return false;
  }
  return (count ?? 0) >= max;
}

export async function recordHit(svc: Svc, kind: LimitKind, key: string) {
  const { error } = await svc.from("rate_events").insert({ kind, key });
  if (error) console.error("[rate-limit] record failed:", error.message);
}

/** Drop entries older than a day; called from the daily keep-alive. */
export async function pruneRateEvents(svc: Svc) {
  await svc.from("rate_events").delete().lt("created_at", new Date(Date.now() - 86_400_000).toISOString());
}
