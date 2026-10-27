"use client";
import { useState, type FormEvent } from "react";
type Item = { id:number; name:string; description:string; price:number; category:string; image_url:string; is_vegetarian:boolean; is_available:boolean };
const categories = ["Pizza","Indian","Burgers","Desserts","Drinks","Popular"];
export default function AdminMenuPage() {
  const [token,setToken] = useState(""); const [items,setItems] = useState<Item[]>([]); const [error,setError] = useState(""); const [message,setMessage] = useState("");
  const [form,setForm] = useState({name:"",description:"",price:"",category:"Indian",image_url:"",is_vegetarian:true});
  async function load() {
    setError(""); setMessage("");
    try { const r=await fetch("/api/admin/menu",{headers:{"x-admin-token":token},cache:"no-store"}); const d=await r.json(); if(!r.ok) throw new Error(d.error); setItems(d.items); }
    catch(e) { setError(e instanceof Error?e.message:"Unable to load menu."); }
  }
  async function update(id:number,patch:Partial<Item>) {
    setError(""); setMessage("");
    try { const r=await fetch(`/api/admin/menu/${id}`,{method:"PATCH",headers:{"Content-Type":"application/json","x-admin-token":token},body:JSON.stringify(patch)}); const d=await r.json(); if(!r.ok) throw new Error(d.error); setItems(current=>current.map(item=>item.id===id?d.item:item)); setMessage("Menu item updated."); }
    catch(e) { setError(e instanceof Error?e.message:"Unable to update item."); }
  }
  async function add(event:FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setMessage("");
    try { const r=await fetch("/api/admin/menu",{method:"POST",headers:{"Content-Type":"application/json","x-admin-token":token},body:JSON.stringify({...form,price:Number(form.price),is_available:true})}); const d=await r.json(); if(!r.ok) throw new Error(d.error); setItems(current=>[...current,d.item]); setForm({name:"",description:"",price:"",category:"Indian",image_url:"",is_vegetarian:true}); setMessage("Food item added."); }
    catch(e) { setError(e instanceof Error?e.message:"Unable to add item."); }
  }
  return <main className="container" style={{padding:"30px 0 70px"}}>
    <a className="logo" href="/"><span className="logo-mark">f.</span> foodiehub.</a>
    <div className="section-head" style={{marginTop:32}}><div><span className="kicker">Restaurant operations</span><h1 style={{fontSize:38,margin:"8px 0"}}>Manage menu</h1><p>Update prices and switch dishes on or off when they sell out.</p></div><a className="btn btn-light" href="/admin">Order dashboard</a></div>
    <div className="notice error">Use your server-configured admin token. For production, replace token access with Supabase Auth roles.</div>
    <div style={{display:"flex",gap:10,marginBottom:24,flexWrap:"wrap"}}><input className="search" type="password" value={token} onChange={e=>setToken(e.target.value)} placeholder="ADMIN_ACCESS_TOKEN" aria-label="Admin access token"/><button className="btn" onClick={load} disabled={!token}>Load menu</button></div>
    {error&&<div className="notice error">{error}</div>}{message&&<div className="notice">{message}</div>}
    <section className="modal" style={{maxHeight:"none",marginBottom:25,width:"100%"}}><h2>Add a food item</h2><form onSubmit={add} className="form-grid" style={{marginTop:18}}>
      <label className="field">Name<input required value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/></label>
      <label className="field">Price (₹)<input required type="number" min="0" step="0.01" value={form.price} onChange={e=>setForm({...form,price:e.target.value})}/></label>
      <label className="field">Category<select value={form.category} onChange={e=>setForm({...form,category:e.target.value})}>{categories.map(c=><option key={c}>{c}</option>)}</select></label>
      <label className="field">Image URL<input value={form.image_url} onChange={e=>setForm({...form,image_url:e.target.value})} placeholder="https://…"/></label>
      <label className="field full">Description<input value={form.description} onChange={e=>setForm({...form,description:e.target.value})}/></label>
      <label style={{display:"flex",alignItems:"center",gap:8,fontSize:13}}><input type="checkbox" checked={form.is_vegetarian} onChange={e=>setForm({...form,is_vegetarian:e.target.checked})}/> Vegetarian</label>
      <div className="field"><button className="btn" disabled={!token}>Add food item</button></div>
    </form></section>
    <div style={{display:"grid",gap:12}}>{items.map(item=><article key={item.id} className="food-card" style={{padding:16,display:"flex",alignItems:"center",gap:14,flexWrap:"wrap"}}>
      <img src={item.image_url||"https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=180&q=70"} alt="" style={{width:76,height:76,borderRadius:14,objectFit:"cover"}}/>
      <div style={{flex:1,minWidth:160}}><strong>{item.name}</strong><p style={{fontSize:12,color:"#72776f",margin:"5px 0"}}>{item.category} · {item.is_vegetarian?"Veg":"Non-veg"}</p><strong className="price">₹{Number(item.price).toFixed(0)}</strong></div>
      <label style={{display:"flex",alignItems:"center",gap:8,fontSize:12,fontWeight:800}}><input type="checkbox" checked={item.is_available} onChange={e=>update(item.id,{is_available:e.target.checked})}/>{item.is_available?"Available":"Sold out"}</label>
      <label className="field" style={{width:100}}>Price<input type="number" min="0" step="1" defaultValue={item.price} onBlur={e=>{if(Number(e.target.value)!==Number(item.price))update(item.id,{price:Number(e.target.value)});}}/></label>
    </article>)}</div>
    {!items.length&&<div className="empty-state">Load the menu after entering your admin token.</div>}
  </main>;
}