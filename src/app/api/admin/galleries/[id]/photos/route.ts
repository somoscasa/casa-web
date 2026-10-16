import { NextResponse } from "next/server";
import {
  getServerSupabase,
  getServiceSupabase,
  supabaseConfigured,
} from "@/lib/supabase/server";
import { isAdmin } from "@/lib/admin";

type Payload = {
  storage_path?: string;
  original_filename?: string;
  sort_order?: number;
};

export async function POST(req: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  if (!supabaseConfigured()) {
    return NextResponse.json({ error: "supabase_not_configured" }, { status: 503 });
  }
  const supabase = await getServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!isAdmin(user.email))
    return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const body = (await req.json()) as Payload;
  if (!body.storage_path) {
    return NextResponse.json({ error: "missing_storage_path" }, { status: 400 });
  }

  const svc = getServiceSupabase();
  const { error } = await svc.from("photos").insert({
    gallery_id: params.id,
    storage_path: body.storage_path,
    original_filename: body.original_filename ?? null,
    sort_order: body.sort_order ?? 0,
  });
  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
