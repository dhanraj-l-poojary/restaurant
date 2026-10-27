import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
function authorized(request: NextRequest) {
  const expected = process.env.ADMIN_ACCESS_TOKEN;
  const supplied = request.headers.get("x-admin-token");
  return Boolean(expected && supplied && supplied === expected);
}
export async function GET(request: NextRequest) {
  if (!authorized(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: "Configure Supabase before using the admin dashboard." }, { status: 503 });
  const { data, error } = await supabase.from("orders").select("id,customer_name,customer_phone,delivery_address,status,payment_status,payment_method,total_amount,created_at,order_items(item_name,quantity,subtotal)").order("created_at", { ascending: false }).limit(100);
  if (error) return NextResponse.json({ error: "Could not load orders." }, { status: 500 });
  return NextResponse.json({ orders: data ?? [] });
}