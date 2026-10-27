import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const expected = process.env.ADMIN_ACCESS_TOKEN;
  if (!expected || request.headers.get("x-admin-token") !== expected) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await context.params;
  if (!/^\d+$/.test(id)) return NextResponse.json({ error: "Invalid menu item ID." }, { status: 400 });
  let body: Record<string, unknown>;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid request body." }, { status: 400 }); }
  const update: Record<string, unknown> = {};
  if (typeof body.is_available === "boolean") update.is_available = body.is_available;
  if (typeof body.name === "string" && body.name.trim()) update.name = body.name.trim().slice(0,120);
  if (typeof body.description === "string") update.description = body.description.slice(0,500);
  if (body.price !== undefined) {
    const price = Number(body.price);
    if (!Number.isFinite(price) || price < 0 || price > 100000) return NextResponse.json({ error: "Invalid price." }, { status: 400 });
    update.price = price;
  }
  if (!Object.keys(update).length) return NextResponse.json({ error: "No supported changes provided." }, { status: 400 });
  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: "Configure Supabase first." }, { status: 503 });
  const { data, error } = await supabase.from("menu_items").update(update).eq("id", Number(id)).select("*").single();
  if (error || !data) return NextResponse.json({ error: "Could not update menu item." }, { status: 500 });
  return NextResponse.json({ item: data });
}