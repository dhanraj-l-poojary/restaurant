import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
const allowedStatuses = new Set(["confirmed", "preparing", "ready_for_pickup", "out_for_delivery", "delivered", "cancelled"]);
export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const expected = process.env.ADMIN_ACCESS_TOKEN;
  if (!expected || request.headers.get("x-admin-token") !== expected) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await context.params;
  let body: { status?: string };
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid request body." }, { status: 400 }); }
  if (!allowedStatuses.has(body.status ?? "")) return NextResponse.json({ error: "Invalid order status." }, { status: 400 });
  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: "Configure Supabase first." }, { status: 503 });
  const { data, error } = await supabase.from("orders").update({ status: body.status }).eq("id", id).select("id,status").single();
  if (error || !data) return NextResponse.json({ error: "Could not update order." }, { status: 500 });
  await supabase.from("order_status_history").insert({ order_id: id, status: body.status, note: "Updated by restaurant staff" });
  return NextResponse.json({ order: data });
}