import { createFileRoute, Link } from "@tanstack/react-router";
import { Trash2, Minus, Plus } from "lucide-react";
import { useCart } from "@/lib/cart";
import { Button } from "@/components/ui/button";
import { formatKES } from "@/lib/format";
import { resolveImage } from "@/lib/assetMap";

export const Route = createFileRoute("/cart")({
  head: () => ({ meta: [{ title: "Your Cart — Prince Esquare" }] }),
  component: CartPage,
});

function CartPage() {
  const { lines, updateQty, remove, subtotal, count } = useCart();

  if (count === 0) {
    return (
      <div className="container mx-auto px-4 py-24 text-center">
        <h1 className="font-display text-4xl font-bold">Your cart is empty</h1>
        <p className="mt-3 text-muted-foreground">Discover something refined.</p>
        <Link to="/shop" className="mt-6 inline-block">
          <Button variant="hero" size="lg">Shop the Collection</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="mb-8 font-display text-4xl font-bold">Your Cart</h1>
      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        <div className="space-y-3">
          {lines.map((l) => (
            <div key={`${l.productId}-${l.variantId}`} className="flex gap-4 rounded-md border border-border bg-card p-4">
              <Link to="/product/$slug" params={{ slug: l.slug }} className="h-24 w-20 shrink-0 overflow-hidden rounded bg-muted">
                <img src={resolveImage(l.image)} alt={l.title} className="h-full w-full object-cover" />
              </Link>
              <div className="flex-1">
                <Link to="/product/$slug" params={{ slug: l.slug }} className="font-medium hover:text-gold">{l.title}</Link>
                <p className="mt-1 text-xs text-muted-foreground">
                  {l.size && <>Size {l.size}</>}{l.size && l.color && " · "}{l.color}
                </p>
                <div className="mt-3 flex items-center justify-between">
                  <div className="flex items-center rounded border border-border">
                    <button onClick={() => updateQty(l.productId, l.variantId, l.quantity - 1)} className="px-2 py-1"><Minus className="h-3 w-3" /></button>
                    <span className="w-8 text-center text-sm">{l.quantity}</span>
                    <button onClick={() => updateQty(l.productId, l.variantId, l.quantity + 1)} className="px-2 py-1"><Plus className="h-3 w-3" /></button>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-semibold">{formatKES(l.price * l.quantity)}</span>
                    <button onClick={() => remove(l.productId, l.variantId)} className="text-muted-foreground hover:text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        <aside className="h-fit rounded-md border border-border bg-card p-6">
          <h2 className="font-display text-xl font-bold">Order Summary</h2>
          <div className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between"><span>Subtotal</span><span className="font-medium">{formatKES(subtotal)}</span></div>
            <div className="flex justify-between text-muted-foreground"><span>Delivery</span><span>Calculated at checkout</span></div>
            <div className="my-3 h-px bg-border" />
            <div className="flex justify-between text-base font-semibold"><span>Estimated Total</span><span className="text-gold">{formatKES(subtotal)}</span></div>
          </div>
          <Link to="/checkout" className="mt-6 block">
            <Button variant="hero" size="lg" className="w-full">Proceed to Checkout</Button>
          </Link>
          <Link to="/shop" className="mt-3 block text-center text-xs text-muted-foreground hover:text-gold">Continue shopping →</Link>
        </aside>
      </div>
    </div>
  );
}
