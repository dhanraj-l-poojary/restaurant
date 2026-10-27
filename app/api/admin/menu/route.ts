import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
function authorized(request: NextRequest) {
  const expected = process.env.ADMIN_ACCESS_TOKEN;
  return Boolean(expected && request.headers.get("x-admin-token") === expected);
}
export async function GET(request: NextRequest) {
  if (!authorized(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: "Configure Supabase first." }, { status: 503 });
  const { data, error } = await supabase.from("menu_items").select("*").order("id");
  if (error) return NextResponse.json({ error: "Could not load menu." }, { status: 500 });
  return NextResponse.json({ items: data ?? [] });
}
export async function POST(request: NextRequest) {
  if (!authorized(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: "Configure Supabase first." }, { status: 503 });
  let body: Record<string, unknown>;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid request body." }, { status: 400 }); }
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const price = Number(body.price);
  if (!name || name.length > 120 || !Number.isFinite(price) || price < 0 || price > 100000) return NextResponse.json({ error: "Enter a valid name and price." }, { status: 400 });
  const row = {
    name, price, description: typeof body.description === "string" ? body.description.slice(0,500) : "",
    image_url: typeof body.image_url === "string" ? body.image_url.slice(0,1000) : "",
    category: typeof body.category === "string" ? body.category : "Popular",
    is_vegetarian: body.is_vegetarian !== false, is_available: body.is_available !== false,
    badge: typeof body.badge === "string" ? body.badge.slice(0,40) : null
  };
  const { data, error } = await supabase.from("menu_items").insert(row).select("*").single();
  if (error) return NextResponse.json({ error: "Could not add menu item." }, { status: 500 });
  return NextResponse.json({ item: data }, { status: 201 });
}