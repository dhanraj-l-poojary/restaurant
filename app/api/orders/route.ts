import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { demoMenu } from "@/lib/menu";
type OrderInput = { customerName?: string; phone?: string; address?: string; notes?: string; paymentMethod?: "cod" | "online"; items?: { id: number; quantity: number }[] };

export async function POST(request: NextRequest) {
  let body: OrderInput;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid request body." }, { status: 400 }); }
  const customerName = body.customerName?.trim(), phone = body.phone?.trim(), address = body.address?.trim(), items = body.items;
  if (!customerName || !phone || !address || !Array.isArray(items) || items.length === 0) return NextResponse.json({ error: "Please provide your name, phone, address, and at least one item." }, { status: 400 });
  if (customerName.length > 100 || phone.length > 30 || address.length > 500) return NextResponse.json({ error: "One or more fields are too long." }, { status: 400 });
  if (items.some((item) => !Number.isInteger(item.id) || !Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 20)) return NextResponse.json({ error: "Each quantity must be between 1 and 20." }, { status: 400 });

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    const byId = new Map(demoMenu.map((item) => [item.id, item]));
    const selected = items.map((line) => {
      const menuItem = byId.get(line.id);
      return menuItem ? { item: menuItem, quantity: line.quantity } : null;
    });
    if (selected.some((line) => !line || !line.item.is_available)) return NextResponse.json({ error: "One or more items are unavailable." }, { status: 409 });
    const subtotal = selected.reduce((sum, line) => sum + (line ? line.item.price * line.quantity : 0), 0);
    return NextResponse.json({ demo: true, orderId: `DEMO-${Date.now().toString().slice(-8)}`, status: "confirmed", total: subtotal + (subtotal >= 499 ? 0 : 30), message: "Demo order created. Configure Supabase to persist real orders." }, { status: 201 });
  }

  const ids = [...new Set(items.map((item) => item.id))];
  const { data: menuItems, error: menuError } = await supabase.from("menu_items").select("id,name,price,is_available").in("id", ids);
  if (menuError) return NextResponse.json({ error: "Could not verify menu items." }, { status: 500 });
  const menuMap = new Map((menuItems ?? []).map((item) => [Number(item.id), item]));
  if (items.some((item) => !menuMap.has(item.id) || !menuMap.get(item.id)?.is_available)) return NextResponse.json({ error: "One or more items are sold out. Refresh the menu and try again." }, { status: 409 });
  const orderLines = items.map((item) => {
    const menuItem = menuMap.get(item.id)!;
    return { menu_item_id: menuItem.id, item_name: menuItem.name, quantity: item.quantity, unit_price: Number(menuItem.price), subtotal: Number(menuItem.price) * item.quantity };
  });
  const subtotal = orderLines.reduce((sum, item) => sum + item.subtotal, 0), deliveryFee = subtotal >= 499 ? 0 : 30, total = subtotal + deliveryFee;
  const { data: order, error: orderError } = await supabase.from("orders").insert({
    customer_name: customerName, customer_phone: phone, delivery_address: address, notes: body.notes?.trim() || null,
    status: "confirmed", payment_method: body.paymentMethod === "online" ? "online" : "cod", payment_status: "pending",
    subtotal, delivery_fee: deliveryFee, discount_amount: 0, total_amount: total
  }).select("id,status,total_amount").single();
  if (orderError || !order) {
    console.error("Order insert failed:", orderError?.message);
    return NextResponse.json({ error: "Could not create your order. Please try again." }, { status: 500 });
  }
  const { error: itemsError } = await supabase.from("order_items").insert(orderLines.map((item) => ({ ...item, order_id: order.id })));
  if (itemsError) {
    await supabase.from("orders").delete().eq("id", order.id);
    console.error("Order items insert failed:", itemsError.message);
    return NextResponse.json({ error: "Could not save order items. Please try again." }, { status: 500 });
  }
  await supabase.from("order_status_history").insert({ order_id: order.id, status: "confirmed", note: "Order received" });
  return NextResponse.json({ demo: false, orderId: order.id, status: order.status, total: Number(order.total_amount), message: "Your order has been placed." }, { status: 201 });
}