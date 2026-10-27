"use client";
import { useState } from "react";
type Row = { id:string; customer_name:string; customer_phone:string; delivery_address:string; status:string; payment_status:string; payment_method:string; total_amount:number; created_at:string; order_items:{item_name:string;quantity:number;subtotal:number}[] };
const statuses = ["confirmed","preparing","ready_for_pickup","out_for_delivery","delivered","cancelled"];
const money = (n:number) => new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR",maximumFractionDigits:0}).format(n);
export default function AdminPage() {
  const [token,setToken] = useState(""); const [orders,setOrders] = useState<Row[]>([]); const [error,setError] = useState(""); const [loading,setLoading] = useState(false);
  async function load() {
    setLoading(true); setError("");
    try { const r=await fetch("/api/admin/orders",{headers:{"x-admin-token":token},cache:"no-store"}); const d=await r.json(); if(!r.ok) throw new Error(d.error); setOrders(d.orders); }
    catch(e) { setError(e instanceof Error?e.message:"Unable to load orders."); }
    finally { setLoading(false); }
  }
  async function update(id:string,status:string) {
    setError("");
    try { const r=await fetch(`/api/admin/orders/${id}`,{method:"PATCH",headers:{"Content-Type":"application/json","x-admin-token":token},body:JSON.stringify({status})}); const d=await r.json(); if(!r.ok) throw new Error(d.error); await load(); }
    catch(e) { setError(e instanceof Error?e.message:"Unable to update order."); }
  }
  return <main className="container" style={{padding:"30px 0 70px"}}>
    <a className="logo" href="/"><span className="logo-mark">f.</span> foodiehub.</a>
    <div className="section-head" style={{marginTop:35}}><div><span className="kicker">Restaurant operations</span><h1 style={{fontSize:38,margin:"8px 0"}}>Order dashboard</h1><p>Review incoming orders and keep customers updated.</p></div><a className="btn btn-light" href="/">← Customer site</a></div>
    <div className="notice error">Starter admin access uses a server token. For production, replace this with Supabase Auth and trusted admin roles.</div>
    <div style={{display:"flex",gap:10,marginBottom:24,flexWrap:"wrap"}}><input className="search" type="password" value={token} onChange={(e)=>setToken(e.target.value)} placeholder="ADMIN_ACCESS_TOKEN" aria-label="Admin access token"/><button className="btn" disabled={!token||loading} onClick={load}>{loading?"Loading…":"Load orders"}</button></div>
    {error && <div className="notice error">{error}</div>}
    <div style={{display:"grid",gap:15}}>{orders.map((order)=><article key={order.id} className="food-card" style={{padding:20}}>
      <div style={{display:"flex",justifyContent:"space-between",gap:15,flexWrap:"wrap"}}><div><strong>Order {order.id.slice(0,8).toUpperCase()}</strong><p style={{fontSize:12,color:"#72776f"}}>{new Date(order.created_at).toLocaleString()}</p></div><strong className="price">{money(Number(order.total_amount))}</strong></div>
      <p><strong>{order.customer_name}</strong> · {order.customer_phone}</p><p style={{fontSize:13,color:"#72776f"}}>{order.delivery_address}</p>
      <p style={{fontSize:13}}>{order.order_items?.map((i)=>`${i.quantity} × ${i.item_name}`).join(", ")}</p>
      <div style={{display:"flex",alignItems:"center",gap:12,flexWrap:"wrap"}}><span className="food-tag">Payment: {order.payment_status} ({order.payment_method})</span><select className="search" value={order.status} onChange={(e)=>update(order.id,e.target.value)} aria-label="Update order status">{[...new Set([order.status,...statuses])].map((s)=><option key={s} value={s}>{s.replaceAll("_"," ")}</option>)}</select></div>
    </article>)}</div>
    {!orders.length&&!loading&&!error&&<div className="empty-state">Enter your admin token and load orders. New orders will appear here after Supabase is configured.</div>}
  </main>;
}