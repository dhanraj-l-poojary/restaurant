"use client";
import { FormEvent, useEffect, useMemo, useState } from "react";
import type { FoodCategory, MenuItem } from "@/lib/menu";
import { demoMenu } from "@/lib/menu";
type CartItem = { item: MenuItem; quantity: number };
type OrderResult = { orderId: string; total: number; status: string; demo?: boolean; message: string };
const categories: ("All" | FoodCategory)[] = ["All", "Popular", "Pizza", "Indian", "Burgers", "Desserts", "Drinks"];
const money = (amount: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount);

export default function HomePage() {
  const [menu, setMenu] = useState<MenuItem[]>(demoMenu);
  const [category, setCategory] = useState<(typeof categories)[number]>("All");
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState("");
  const [order, setOrder] = useState<OrderResult | null>(null);

  useEffect(() => {
    fetch("/api/menu").then((response) => response.json()).then((data) => {
      if (Array.isArray(data.items) && data.items.length) setMenu(data.items);
    }).catch(() => undefined);
    try { const saved = localStorage.getItem("foodiehub-cart"); if (saved) setCart(JSON.parse(saved) as CartItem[]); } catch { /* ignore invalid local cart */ }
  }, []);
  useEffect(() => { localStorage.setItem("foodiehub-cart", JSON.stringify(cart)); }, [cart]);

  const filteredMenu = useMemo(() => menu.filter((item) => {
    const matchesCategory = category === "All" || (category === "Popular" ? Boolean(item.badge) : item.category === category);
    const term = search.toLowerCase().trim();
    return matchesCategory && (!term || item.name.toLowerCase().includes(term) || item.description.toLowerCase().includes(term));
  }), [menu, category, search]);
  const count = cart.reduce((sum, line) => sum + line.quantity, 0);
  const subtotal = cart.reduce((sum, line) => sum + line.item.price * line.quantity, 0);
  const deliveryFee = subtotal === 0 || subtotal >= 499 ? 0 : 30;
  const total = subtotal + deliveryFee;

  function addToCart(item: MenuItem) {
    if (!item.is_available) return;
    setCart((current) => {
      const found = current.find((line) => line.item.id === item.id);
      return found ? current.map((line) => line.item.id === item.id ? { ...line, quantity: Math.min(line.quantity + 1, 20) } : line) : [...current, { item, quantity: 1 }];
    });
    setNotice(`${item.name} added to your cart.`);
    window.setTimeout(() => setNotice(""), 2400);
  }
  function changeQuantity(id: number, delta: number) {
    setCart((current) => current.map((line) => line.item.id === id ? { ...line, quantity: line.quantity + delta } : line).filter((line) => line.quantity > 0));
  }
  async function placeOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setLoading(true); setNotice("");
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/orders", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({
        customerName: form.get("customerName"), phone: form.get("phone"), address: form.get("address"), notes: form.get("notes"),
        paymentMethod: form.get("paymentMethod"), items: cart.map((line) => ({ id: line.item.id, quantity: line.quantity }))
      }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not place your order.");
      setOrder(data as OrderResult); setCart([]); setCheckoutOpen(false); setCartOpen(false);
    } catch (error) { setNotice(error instanceof Error ? error.message : "Something went wrong."); }
    finally { setLoading(false); }
  }

  return <main>
    <header className="container nav">
      <a className="logo" href="#" aria-label="FoodieHub home"><span className="logo-mark">f.</span> foodiehub<span style={{ color: "#e45d35" }}>.</span></a>
      <nav className="nav-links" aria-label="Main navigation"><a href="#">Home</a><a href="#menu">Our Menu</a><a href="#why-us">Why us</a><a href="/admin">Admin</a><button className="btn" onClick={() => setCartOpen(true)}>🛒 Cart <span className="cart-count">{count}</span></button></nav>
    </header>

    <section className="container hero">
      <div><span className="eyebrow">✦ Fresh from our kitchen</span><h1>Good food.<br />Good mood.<br /><span>Good times.</span></h1>
        <p>Crave it, click it, love it. Discover fresh, flavour-packed favourites made with care and delivered straight to your door.</p>
        <div className="hero-actions"><a className="btn" href="#menu">Explore the menu&nbsp; ↗</a><button className="btn btn-light" onClick={() => setCartOpen(true)}>View your cart</button></div>
        <div className="hero-meta"><span>⭐ 4.8/5 customer love</span><span>🚴 Fast local delivery</span><span>🥬 Fresh ingredients</span></div>
      </div>
      <div className="hero-photo-wrap"><img className="hero-photo" src="https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=1200&q=90" alt="Freshly prepared colourful food bowl" />
        <div className="floating-card"><span className="floating-icon">🥗</span><span><strong>Fresh & made to order</strong><small>Little moments, big flavours</small></span></div>
      </div>
    </section>

    <section className="container section" id="menu">
      <div className="section-head"><div><span className="kicker">Made with a little extra love</span><h2>Find your new favourite</h2><p>Big cravings deserve delicious answers.</p></div>
        <input className="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="⌕  Search food..." aria-label="Search food menu" /></div>
      <div className="category-row" role="group" aria-label="Filter menu by category">{categories.map((item) => <button key={item} className={`chip ${category === item ? "active" : ""}`} onClick={() => setCategory(item)}>{item}</button>)}</div>
      {notice && !order && !checkoutOpen && <div className={`notice ${notice.includes("Could not") || notice.includes("unavailable") ? "error" : ""}`} role="status">{notice}</div>}
      <div className="food-grid">{filteredMenu.map((item) => <article className="food-card" key={item.id}>
        <div className="food-image-wrap"><img className="food-image" src={item.image_url} alt={item.name} loading="lazy" />{item.badge && <span className="food-badge">✦ {item.badge}</span>}</div>
        <div className="food-content"><div className="food-title-row"><h3>{item.name}</h3><span className="price">{money(Number(item.price))}</span></div>
          <p className="food-description">{item.description}</p><div className="food-bottom"><span className="food-tag">{item.is_vegetarian ? "● Veg" : "● Non-veg"} · {item.is_available ? "Available" : "Sold out"}</span><button className="add-btn" disabled={!item.is_available} onClick={() => addToCart(item)}>{item.is_available ? "+ Add" : "Sold out"}</button></div>
        </div>
      </article>)}{filteredMenu.length === 0 && <div className="empty-state">No dishes found. Try another search or category.</div>}</div>
    </section>

    <section className="container promo"><div className="promo-copy"><span className="kicker" style={{ color: "#f29a7e" }}>A little treat from us</span><h2>Good things come<br />to hungry people.</h2><p>Get free delivery on orders above ₹499. Pick your favourites and let us handle the delicious part.</p><a className="btn" href="#menu">Find something tasty&nbsp; ↗</a></div>
      <img className="promo-photo" src="https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=1200&q=85" alt="Freshly grilled meal served at a restaurant" loading="lazy" /></section>

    <section className="container perks" id="why-us"><article className="perk"><span className="perk-icon">🥬</span><h3>Fresh by nature</h3><p>Quality ingredients and food prepared with care, every single time.</p></article><article className="perk"><span className="perk-icon">⚡</span><h3>Easy ordering</h3><p>A few taps from choosing your meal to getting your order confirmed.</p></article><article className="perk"><span className="perk-icon">💚</span><h3>Made for your day</h3><p>Comfort-food classics and new favourites for every kind of craving.</p></article></section>
    <footer className="container footer"><a className="logo" href="#"><span className="logo-mark">f.</span> foodiehub.</a><span>Fresh food. Happy hearts. © {new Date().getFullYear()} FoodieHub.</span><span>Demo restaurant · Prices shown in INR</span></footer>

    {cartOpen && <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setCartOpen(false); }}><section className="modal" role="dialog" aria-modal="true" aria-labelledby="cart-title">
      <div className="section-head"><div><span className="kicker">Your delicious picks</span><h2 id="cart-title">Your cart ({count})</h2></div><button className="btn btn-light" onClick={() => setCartOpen(false)} aria-label="Close cart">✕</button></div>
      {cart.length === 0 ? <div className="empty-state">Your cart is waiting for something delicious.<br /><button className="btn" style={{ marginTop: 16 }} onClick={() => { setCartOpen(false); document.getElementById("menu")?.scrollIntoView({ behavior: "smooth" }); }}>Browse menu</button></div> : <>
        <div className="cart-lines">{cart.map(({ item, quantity }) => <div className="cart-line" key={item.id}><img src={item.image_url} alt="" /><div className="cart-line-main"><strong>{item.name}</strong><small>{money(item.price)} each</small></div><div className="qty"><button onClick={() => changeQuantity(item.id, -1)} aria-label={`Remove one ${item.name}`}>−</button><strong>{quantity}</strong><button onClick={() => changeQuantity(item.id, 1)} aria-label={`Add one ${item.name}`}>+</button></div></div>)}</div>
        <div className="total-row"><span>Subtotal</span><strong>{money(subtotal)}</strong></div><div className="total-row"><span>Delivery</span><strong>{deliveryFee ? money(deliveryFee) : "FREE"}</strong></div><div className="total-row final"><span>Total</span><strong>{money(total)}</strong></div>
        {subtotal < 499 && <p className="modal-subtitle">Add {money(499 - subtotal)} more to unlock free delivery.</p>}
        <button className="btn" style={{ width: "100%" }} onClick={() => { setCartOpen(false); setCheckoutOpen(true); }}>Continue to checkout&nbsp; →</button>
      </>}
    </section></div>}

    {checkoutOpen && <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setCheckoutOpen(false); }}><section className="modal" role="dialog" aria-modal="true" aria-labelledby="checkout-title">
      <div className="section-head"><div><span className="kicker">Almost there</span><h2 id="checkout-title">Delivery details</h2></div><button className="btn btn-light" onClick={() => setCheckoutOpen(false)} aria-label="Close checkout">✕</button></div>
      <p className="modal-subtitle">Tell us where to bring your food. Online payment is a placeholder until a payment gateway is configured.</p>{notice && <div className="notice error" role="alert">{notice}</div>}
      <form onSubmit={placeOrder}><div className="form-grid"><label className="field">Full name<input name="customerName" required maxLength={100} placeholder="Your name" /></label><label className="field">Mobile number<input name="phone" required maxLength={30} type="tel" placeholder="+91 98765 43210" /></label>
        <label className="field full">Delivery address<textarea name="address" required maxLength={500} rows={3} placeholder="House number, street, area, city" /></label><label className="field full">Delivery instructions (optional)<input name="notes" maxLength={300} placeholder="Landmark, gate code, etc." /></label>
        <label className="field full">Payment method<select name="paymentMethod"><option value="cod">Cash on delivery</option><option value="online">Online payment (not activated)</option></select></label></div>
        <div className="total-row final"><span>Order total</span><strong>{money(total)}</strong></div><button className="btn" disabled={loading || cart.length === 0} style={{ width: "100%", marginTop: 12 }}>{loading ? "Placing order..." : "Place order · " + money(total)}</button></form>
    </section></div>}

    {order && <div className="modal-backdrop"><section className="modal" role="dialog" aria-modal="true" aria-labelledby="success-title"><div style={{ textAlign: "center", padding: "12px 0" }}><div style={{ fontSize: 54 }}>🎉</div><span className="eyebrow">Order received</span><h2 id="success-title" style={{ marginTop: 17 }}>Thanks for your order!</h2><p className="modal-subtitle">{order.message}</p>
      <div className="notice"><strong>Order ID:</strong> {order.orderId}<br /><strong>Status:</strong> {order.status}<br /><strong>Total:</strong> {money(order.total)}{order.demo ? <><br /><small>This is a demo order and is not saved to a database.</small></> : null}</div>
      {!order.demo && <a className="btn" href={`/orders/${order.orderId}`}>Track your order&nbsp; →</a>}<button className="btn btn-light" style={{ marginLeft: 8 }} onClick={() => { setOrder(null); setNotice(""); }}>Back to menu</button></div></section></div>}
  </main>;
}