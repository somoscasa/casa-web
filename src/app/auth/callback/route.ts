import { NextResponse } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const rawNext = url.searchParams.get("next") ?? "/admin";
  // Only same-site paths: "//host" or "/\\host" would send the fresh session elsewhere.
  const next = /^\/(?![\/\\])/.test(rawNext) ? rawNext : "/admin";

  const supaUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const supaKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

  if (!code || !supaUrl || !supaKey) {
    return NextResponse.redirect(
      new URL("/admin/login?error=missing_code", req.url),
    );
  }

  const cookieStore = cookies();
  const supabase = createServerClient(supaUrl, supaKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      set(name: string, value: string, options: CookieOptions) {
        cookieStore.set({ name, value, ...options });
      },
      remove(name: string, options: CookieOptions) {
        cookieStore.set({ name, value: "", ...options });
      },
    },
  });

  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return NextResponse.redirect(
      new URL(
        `/admin/login?error=${encodeURIComponent(error.message)}`,
        req.url,
      ),
    );
  }

  return NextResponse.redirect(new URL(next, req.url));
}
