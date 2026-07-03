import { NextResponse } from "next/server";
import { getServiceSupabase, supabaseConfigured } from "@/lib/supabase/server";
import { notionConfigured, syncEventsToNotion } from "@/lib/notion";

// No cachear: cada corrida del cron debe pegarle de verdad a la base.
export const dynamic = "force-dynamic";

/**
 * Keep-alive: una corrida diaria (Vercel Cron) hace una consulta mínima a
 * Supabase para evitar que el proyecto del plan gratis se pause por inactividad.
 * No devuelve datos: solo un count liviano (head:true) sobre una tabla real.
 */
export async function GET(req: Request) {
  // Si está configurada CRON_SECRET, exigir el header que Vercel Cron envía.
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
  }

  if (!supabaseConfigured()) {
    return NextResponse.json({ error: "not_configured" }, { status: 503 });
  }

  try {
    const supabase = getServiceSupabase();
    const { error } = await supabase
      .from("clients")
      .select("id", { count: "exact", head: true });

    if (error) {
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 500 },
      );
    }

    // Sync diario CASA → Notion (best-effort: nunca hace fallar el keep-alive).
    let notion: unknown;
    if (notionConfigured()) {
      try {
        notion = await syncEventsToNotion();
      } catch (e) {
        notion = { error: e instanceof Error ? e.message : "sync_failed" };
      }
    }

    return NextResponse.json({ ok: true, notion });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "keep_alive_failed" },
      { status: 500 },
    );
  }
}
