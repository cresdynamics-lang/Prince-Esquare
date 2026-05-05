import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { formatKES } from "@/lib/format";

export const Route = createFileRoute("/account")({
  head: () => ({ meta: [{ title: "My Account — Prince Esquire" }] }),
  component: AccountPage,
});

function AccountPage() {
  const { user, loading, signOut, canAccessAdminPanel } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<any[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [loading, user, navigate]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("orders")
        .select("id, order_number, status, total, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      setOrders(data ?? []);
      setOrdersLoading(false);
    })();
  }, [user]);

  if (loading || !user) {
    return <div className="container mx-auto py-24 text-center text-muted-foreground">Loading…</div>;
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl font-bold">My Account</h1>
          <p className="mt-1 text-sm text-muted-foreground">{user.email}</p>
        </div>
        <div className="flex gap-2">
          {canAccessAdminPanel && <Link to="/admin"><Button variant="outline">Admin Dashboard</Button></Link>}
          <Button variant="ghost" onClick={() => signOut()}>Sign out</Button>
        </div>
      </div>

      <section className="mt-10">
        <h2 className="mb-4 font-display text-2xl font-bold">Order History</h2>
        {ordersLoading ? (
          <p className="text-sm text-muted-foreground">Loading orders…</p>
        ) : orders.length === 0 ? (
          <p className="rounded-md border border-border bg-card p-6 text-sm text-muted-foreground">
            No orders yet. <Link to="/shop" className="text-gold hover:underline">Start shopping →</Link>
          </p>
        ) : (
          <div className="overflow-x-auto rounded-md border border-border bg-card">
            <table className="w-full text-sm">
              <thead className="bg-secondary/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
                <tr><th className="p-3">Order</th><th className="p-3">Date</th><th className="p-3">Status</th><th className="p-3 text-right">Total</th></tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id} className="border-t border-border">
                    <td className="p-3 font-mono">{o.order_number}</td>
                    <td className="p-3">{new Date(o.created_at).toLocaleDateString()}</td>
                    <td className="p-3 capitalize">{o.status}</td>
                    <td className="p-3 text-right font-semibold">{formatKES(o.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
