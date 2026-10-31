import { NextResponse } from "next/server";
import {
  getServerSupabase,
  getServiceSupabase,
  supabaseConfigured,
} from "@/lib/supabase/server";
import { isAdmin } from "@/lib/admin";

export async function PATCH(req: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  if (!supabaseConfigured())
    return NextResponse.json({ error: "not_configured" }, { status: 503 });
  const supabase = await getServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!isAdmin(user.email))
    return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const body = (await req.json()) as {
    shipping_status?: string;
    payment_status?: string;
  };
  const SHIP = new Set(["pending", "preparando", "enviado", "entregado"]);
  const PAY = new Set(["pending", "paid"]);
  const update: Record<string, string> = {};
  if (body.shipping_status) {
    if (!SHIP.has(body.shipping_status)) return NextResponse.json({ error: "invalid_status" }, { status: 400 });
    update.shipping_status = body.shipping_status;
  }
  if (body.payment_status) {
    if (!PAY.has(body.payment_status)) return NextResponse.json({ error: "invalid_status" }, { status: 400 });
    update.payment_status = body.payment_status;
  }

  if (Object.keys(update).length === 0)
    return NextResponse.json({ error: "no_change" }, { status: 400 });

  const svc = getServiceSupabase();
  const { error } = await svc
    .from("orders")
    .update(update)
    .eq("id", params.id);
  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
