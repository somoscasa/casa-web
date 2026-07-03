import { NextResponse } from "next/server";
import { getServerSupabase, supabaseConfigured } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/admin";
import { notionConfigured, syncEventsToNotion } from "@/lib/notion";

export const dynamic = "force-dynamic";

export async function POST() {
  if (!supabaseConfigured())
    return NextResponse.json({ error: "not_configured" }, { status: 503 });
  const supabase = getServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!isAdmin(user.email))
    return NextResponse.json({ error: "forbidden" }, { status: 403 });

  if (!notionConfigured())
    return NextResponse.json({ error: "notion_not_configured" }, { status: 503 });

  try {
    const result = await syncEventsToNotion();
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "sync_failed" },
      { status: 500 },
    );
  }
}
