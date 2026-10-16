import { NextResponse } from "next/server";
import { getServerSupabase, getServiceSupabase, supabaseConfigured } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/admin";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  if (!supabaseConfigured()) return NextResponse.json({ error: "not_configured" }, { status: 503 });
  const supabase = await getServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !isAdmin(user.email)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const svc = getServiceSupabase();
  const { data, error } = await svc
    .from("collections")
    .select("id, name, sort_order")
    .eq("gallery_id", params.id)
    .order("sort_order");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ collections: data ?? [] });
}

export async function POST(req: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  if (!supabaseConfigured()) return NextResponse.json({ error: "not_configured" }, { status: 503 });

  const supabase = await getServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !isAdmin(user.email)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { name, sort_order = 0 } = await req.json();
  if (!name) return NextResponse.json({ error: "name_required" }, { status: 400 });

  const svc = getServiceSupabase();
  const { data, error } = await svc
    .from("collections")
    .insert({ gallery_id: params.id, name, sort_order })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ collection: data });
}
