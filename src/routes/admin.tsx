import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatKES } from "@/lib/format";
import { toast } from "sonner";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin Dashboard — Prince Esquare" }] }),
  component: AdminPage,
});

function AdminPage() {
  const { user, isStaff, loading } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ orders: 0, revenue: 0, products: 0, lowStock: 0, messages: 0 });
  const [orders, setOrders] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [lowStock, setLowStock] = useState<any[]>([]);

  useEffect(() => {
    if (!loading && (!user || !isStaff)) navigate({ to: "/" });
  }, [loading, user, isStaff, navigate]);

  const loadAll = async () => {
    if (!isStaff) return;
    const [{ data: os }, { data: ps }, { data: ms }, { data: vs }] = await Promise.all([
      supabase.from("orders").select("id, order_number, status, total, created_at, guest_name").order("created_at", { ascending: false }).limit(20),
      supabase.from("products").select("id, title, price, is_published, categories(name)").order("created_at", { ascending: false }).limit(20),
      supabase.from("contact_messages").select("id, name, email, subject, message, is_read, created_at").order("created_at", { ascending: false }).limit(20),
      supabase.from("product_variants").select("id, sku, size, stock_quantity, products(title)").lt("stock_quantity", 5).order("stock_quantity"),
    ]);
    setOrders(os ?? []);
    setProducts(ps ?? []);
    setMessages(ms ?? []);
    setLowStock(vs ?? []);
    const totalRev = (os ?? []).reduce((s, o: any) => s + Number(o.total ?? 0), 0);
    setStats({
      orders: (os ?? []).length,
      revenue: totalRev,
      products: (ps ?? []).length,
      lowStock: (vs ?? []).length,
      messages: (ms ?? []).filter((m: any) => !m.is_read).length,
    });
  };

  useEffect(() => { if (isStaff) loadAll(); }, [isStaff]);

  const updateOrderStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("orders").update({ status }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Order updated");
    loadAll();
  };

  const markMessageRead = async (id: string) => {
    await supabase.from("contact_messages").update({ is_read: true }).eq("id", id);
    loadAll();
  };

  const togglePublish = async (id: string, current: boolean) => {
    await supabase.from("products").update({ is_published: !current }).eq("id", id);
    loadAll();
  };

  if (loading || !isStaff) {
    return <div className="container mx-auto py-24 text-center text-muted-foreground">Checking permissions…</div>;
  }

  return (
    <div className="container mx-auto px-4 py-10">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold">Admin Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">{user?.email}</p>
        </div>
        <Link to="/"><Button variant="outline">View store →</Button></Link>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        {[
          { label: "Recent Orders", value: stats.orders },
          { label: "Recent Revenue", value: formatKES(stats.revenue) },
          { label: "Products", value: stats.products },
          { label: "Low Stock", value: stats.lowStock, accent: stats.lowStock > 0 },
          { label: "Unread Messages", value: stats.messages, accent: stats.messages > 0 },
        ].map((s) => (
          <div key={s.label} className="rounded-md border border-border bg-card p-4">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">{s.label}</p>
            <p className={`mt-1 font-display text-2xl font-bold ${s.accent ? "text-gold" : ""}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <Tabs defaultValue="orders" className="mt-8">
        <TabsList>
          <TabsTrigger value="orders">Orders</TabsTrigger>
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="messages">Messages</TabsTrigger>
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
        </TabsList>

        <TabsContent value="orders">
          <div className="overflow-x-auto rounded-md border border-border bg-card">
            <table className="w-full text-sm">
              <thead className="bg-secondary/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
                <tr><th className="p-3">Order</th><th className="p-3">Customer</th><th className="p-3">Date</th><th className="p-3">Total</th><th className="p-3">Status</th></tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id} className="border-t border-border">
                    <td className="p-3 font-mono text-xs">{o.order_number}</td>
                    <td className="p-3">{o.guest_name ?? "Customer"}</td>
                    <td className="p-3">{new Date(o.created_at).toLocaleDateString()}</td>
                    <td className="p-3 font-semibold">{formatKES(o.total)}</td>
                    <td className="p-3">
                      <select value={o.status} onChange={(e) => updateOrderStatus(o.id, e.target.value)} className="rounded border border-border bg-background px-2 py-1 text-xs capitalize">
                        {["pending", "processing", "shipped", "delivered", "cancelled"].map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </td>
                  </tr>
                ))}
                {orders.length === 0 && <tr><td colSpan={5} className="p-6 text-center text-muted-foreground">No orders yet.</td></tr>}
              </tbody>
            </table>
          </div>
        </TabsContent>

        <TabsContent value="products">
          <div className="overflow-x-auto rounded-md border border-border bg-card">
            <table className="w-full text-sm">
              <thead className="bg-secondary/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
                <tr><th className="p-3">Product</th><th className="p-3">Category</th><th className="p-3">Price</th><th className="p-3">Status</th></tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.id} className="border-t border-border">
                    <td className="p-3">{p.title}</td>
                    <td className="p-3 text-muted-foreground">{p.categories?.name}</td>
                    <td className="p-3 font-semibold">{formatKES(p.price)}</td>
                    <td className="p-3">
                      <button onClick={() => togglePublish(p.id, p.is_published)} className={`rounded px-2 py-1 text-xs ${p.is_published ? "bg-success/15 text-success" : "bg-muted text-muted-foreground"}`}>
                        {p.is_published ? "Published" : "Draft"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>

        <TabsContent value="messages">
          <div className="space-y-3">
            {messages.map((m) => (
              <div key={m.id} className={`rounded-md border bg-card p-4 ${m.is_read ? "border-border" : "border-gold"}`}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">{m.subject}</p>
                    <p className="text-xs text-muted-foreground">{m.name} · <a href={`mailto:${m.email}`} className="text-gold hover:underline">{m.email}</a> · {new Date(m.created_at).toLocaleString()}</p>
                    <p className="mt-3 whitespace-pre-wrap text-sm">{m.message}</p>
                  </div>
                  <div className="flex flex-col gap-2">
                    {!m.is_read && <Button size="sm" variant="outline" onClick={() => markMessageRead(m.id)}>Mark read</Button>}
                    <a href={`mailto:${m.email}?subject=Re: ${encodeURIComponent(m.subject)}`}><Button size="sm" variant="default">Reply</Button></a>
                  </div>
                </div>
              </div>
            ))}
            {messages.length === 0 && <p className="rounded-md border border-border bg-card p-6 text-center text-sm text-muted-foreground">No messages yet.</p>}
          </div>
        </TabsContent>

        <TabsContent value="inventory">
          <div className="overflow-x-auto rounded-md border border-border bg-card">
            <table className="w-full text-sm">
              <thead className="bg-secondary/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
                <tr><th className="p-3">Product</th><th className="p-3">Size</th><th className="p-3">SKU</th><th className="p-3">Stock</th></tr>
              </thead>
              <tbody>
                {lowStock.map((v) => (
                  <tr key={v.id} className="border-t border-border">
                    <td className="p-3">{v.products?.title}</td>
                    <td className="p-3">{v.size}</td>
                    <td className="p-3 font-mono text-xs">{v.sku}</td>
                    <td className="p-3"><span className="rounded bg-destructive/15 px-2 py-0.5 text-xs font-semibold text-destructive">{v.stock_quantity} left</span></td>
                  </tr>
                ))}
                {lowStock.length === 0 && <tr><td colSpan={4} className="p-6 text-center text-success">All variants are well stocked.</td></tr>}
              </tbody>
            </table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
