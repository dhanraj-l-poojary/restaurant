"use client";
import { useCallback, useEffect, useState } from "react";
type History = { status: string; note: string | null; created_at: string };
type Order = { id: string; status: string; total_amount: number; created_at: string; order_status_history: History[] };
const stages = ["confirmed", "preparing", "ready_for_pickup", "out_for_delivery", "delivered"];
const labels: Record<string,string> = { pending: "Order received", confirmed: "Order confirmed", preparing: "Preparing your food", ready_for_pickup: "Ready for pickup", out_for_delivery: "Out for delivery", delivered: "Delivered", cancelled: "Cancelled" };
const money = (n:number) => new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR",maximumFractionDigits:0}).format(n);
export default function TrackingPage({ params }: { params: Promise<{ id: string }> }) {
  const [id,setId] = useState(""); const [order,setOrder] = useState<Order|null>(null); const [error,setError] = useState("");
  useEffect(() => { params.then((p) => setId(p.id)); }, [params]);
  const load = useCallback(async () => {
    if (!id) return;
    try { const response = await fetch(`/api/orders/${id}`,{cache:"no-store"}); const data = await response.json(); if (!response.ok) throw new Error(data.error); setOrder(data.order); setError(""); }
    catch (e) { setError(e instanceof Error ? e.message : "Could not load tracking."); }
  },[id]);
  useEffect(() => { load(); const timer = window.setInterval(load,10000); return () => window.clearInterval(timer); },[load]);
  return <main className="container" style={{padding:"38px 0 80px",maxWidth:780}}>
    <a className="logo" href="/"><span className="logo-mark">f.</span> foodiehub.</a>
    <section className="modal" style={{margin:"34px auto",maxHeight:"none"}}>
      <span className="kicker">Your order, at a glance</span><h1 style={{fontSize:34,letterSpacing:-1,margin:"10px 0"}}>Order tracking</h1>
      <p className="modal-subtitle">This page refreshes automatically every 10 seconds.</p>
      {error && <div className="notice error">{error}</div>}
      {!order && !error && <p>Loading your order status…</p>}
      {order && <><div className="notice"><strong>Order ID:</strong> {order.id}<br/><strong>Total:</strong> {money(Number(order.total_amount))}<br/><strong>Current status:</strong> {labels[order.status] ?? order.status}</div>
        {order.status === "cancelled" ? <p>This order has been cancelled.</p> : <div style={{display:"grid",gap:14,marginTop:24}}>{stages.map((stage,index) => { const current = stages.indexOf(order.status); const done = current >= index; const event = order.order_status_history?.find((item) => item.status === stage); return <div key={stage} style={{display:"flex",gap:14,alignItems:"start",opacity:done?1:.45}}><span style={{width:30,height:30,display:"grid",placeItems:"center",borderRadius:"50%",background:done?"#367b52":"#e7e3d9",color:done?"white":"#72776f",fontWeight:900}}>{done?"✓":index+1}</span><div><strong>{labels[stage]}</strong><p style={{margin:"5px 0 0",fontSize:12,color:"#72776f"}}>{event ? new Date(event.created_at).toLocaleString() : done ? "Completed" : "Waiting for update"}</p></div></div>; })}</div>}
        <p style={{fontSize:12,color:"#72776f",marginTop:24}}>Need help? Please contact the restaurant and share your order ID.</p></>}
      <a className="btn btn-light" style={{display:"inline-block",marginTop:12}} href="/">← Back to menu</a>
    </section>
  </main>;
}