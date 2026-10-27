import { NextResponse } from "next/server";
import { demoMenu } from "@/lib/menu";
import { getSupabaseAdmin } from "@/lib/supabase";
export const dynamic = "force-dynamic";
export async function GET() {
  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ items: demoMenu, source: "demo" });
  const { data, error } = await supabase.from("menu_items").select("id,name,description,price,image_url,category,is_vegetarian,is_available,badge").order("id", { ascending: true });
  if (error) {
    console.error("Menu query failed:", error.message);
    return NextResponse.json({ items: demoMenu, source: "demo", warning: "Database unavailable; showing sample menu." });
  }
  return NextResponse.json({ items: data ?? [], source: "supabase" });
}