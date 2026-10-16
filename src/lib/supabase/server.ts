import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createClient as createPlainClient } from "@supabase/supabase-js";

export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
const SUPABASE_SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

export function supabaseConfigured() {
  return Boolean(SUPABASE_URL && SUPABASE_ANON);
}

/** Server client that reads cookies for auth (RLS-respecting). */
export function getServerSupabase() {
  const cookieStore = cookies();
  return createServerClient(SUPABASE_URL, SUPABASE_ANON, {
    global: { fetch: (input, init) => fetch(input, { ...init, cache: "no-store" }) },
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      set(name: string, value: string, options: CookieOptions) {
        try {
          cookieStore.set({ name, value, ...options });
        } catch {
          /* set called from a Server Component — ignore */
        }
      },
      remove(name: string, options: CookieOptions) {
        try {
          cookieStore.set({ name, value: "", ...options });
        } catch {
          /* ignore */
        }
      },
    },
  });
}

/**
 * Generate signed URLs in batches to avoid overwhelming Supabase with 1000+ concurrent requests.
 */
export async function batchSignedUrls(
  svc: ReturnType<typeof getServiceSupabase>,
  bucket: string,
  paths: string[],
  expiresIn: number,
  batchSize = 50,
): Promise<(string | null)[]> {
  const results: (string | null)[] = new Array(paths.length).fill(null);
  for (let i = 0; i < paths.length; i += batchSize) {
    const batch = paths.slice(i, i + batchSize);
    const signed = await Promise.all(
      batch.map((p) => svc.storage.from(bucket).createSignedUrl(p, expiresIn)),
    );
    for (let j = 0; j < signed.length; j++) {
      results[i + j] = signed[j].data?.signedUrl ?? null;
    }
  }
  return results;
}

/** Admin client using the service role — bypasses RLS. Server-only. */
export function getServiceSupabase() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE) {
    throw new Error(
      "Supabase service role no configurado (SUPABASE_SERVICE_ROLE_KEY).",
    );
  }
  return createPlainClient(SUPABASE_URL, SUPABASE_SERVICE, {
    auth: { persistSession: false, autoRefreshToken: false },
    // Next.js caches fetch() by default; DB reads must always be fresh.
    global: { fetch: (input, init) => fetch(input, { ...init, cache: "no-store" }) },
  });
}
