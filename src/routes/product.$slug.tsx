import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Heart, Truck, Store, ShieldCheck, Minus, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { resolveImage } from "@/lib/assetMap";
import { formatKES } from "@/lib/format";
import { useCart } from "@/lib/cart";
import { useWishlist } from "@/lib/wishlist";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/product/$slug")({
  component: ProductPage,
});

type Variant = { id: string; size: string | null; color: string | null; stock_quantity: number };

function ProductPage() {
  const { slug } = Route.useParams();
  const cart = useCart();
  const wishlist = useWishlist();
  const [product, setProduct] = useState<any>(null);
  const [variants, setVariants] = useState<Variant[]>([]);
  const [images, setImages] = useState<string[]>([]);
  const [activeVariant, setActiveVariant] = useState<Variant | null>(null);
  const [qty, setQty] = useState(1);
  const [loading, setLoading] = useState(true);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data: p } = await supabase
        .from("products")
        .select("id,slug,title,description,price,sale_price,categories(name,slug),product_images(image_url),product_variants(id,size,color,stock_quantity)")
        .eq("slug", slug)
        .eq("is_published", true)
        .maybeSingle();
      if (!p) {
        setMissing(true);
        setLoading(false);
        return;
      }
      setProduct(p);
      const imgs = (p.product_images ?? []).map((i: any) => i.image_url);
      setImages(imgs.length > 0 ? imgs : [null as any]);
      const vs = (p.product_variants ?? []) as Variant[];
      setVariants(vs);
      setActiveVariant(vs.find((v) => v.stock_quantity > 0) ?? vs[0] ?? null);
      setLoading(false);
    })();
  }, [slug]);

  if (missing) throw notFound();
  if (loading || !product) {
    return (
      <div className="container mx-auto grid gap-8 px-4 py-12 md:grid-cols-2">
        <div className="aspect-[4/5] animate-pulse rounded-md bg-muted" />
        <div className="space-y-3">
          <div className="h-8 w-3/4 animate-pulse rounded bg-muted" />
          <div className="h-6 w-1/3 animate-pulse rounded bg-muted" />
          <div className="h-24 animate-pulse rounded bg-muted" />
        </div>
      </div>
    );
  }

  const onSale = product.sale_price != null && Number(product.sale_price) < Number(product.price);
  const displayPrice = onSale ? Number(product.sale_price) : Number(product.price);
  const sizes = [...new Set(variants.map((v) => v.size).filter(Boolean))] as string[];
  const wished = wishlist.has(product.id);

  const handleAdd = () => {
    if (!activeVariant) return;
    if (activeVariant.stock_quantity < qty) {
      toast.error("Not enough stock for that size.");
      return;
    }
    cart.add({
      productId: product.id,
      variantId: activeVariant.id,
      title: product.title,
      image: images[0] ?? "",
      price: displayPrice,
      size: activeVariant.size,
      color: activeVariant.color,
      slug: product.slug,
    }, qty);
    toast.success("Added to cart");
  };

  return (
    <div className="container mx-auto px-4 py-10">
      <nav className="mb-6 text-xs text-muted-foreground">
        <Link to="/" className="hover:text-gold">Home</Link> /{" "}
        <Link to="/shop" className="hover:text-gold">Shop</Link>
        {product.categories && (
          <>
            {" "}/ <Link to="/category/$slug" params={{ slug: product.categories.slug }} className="hover:text-gold">{product.categories.name}</Link>
          </>
        )}{" "}/ <span className="text-foreground">{product.title}</span>
      </nav>

      <div className="grid gap-10 md:grid-cols-2">
        <div className="space-y-3">
          <div className="aspect-[4/5] overflow-hidden rounded-md bg-muted">
            <img src={resolveImage(images[0])} alt={product.title} className="h-full w-full object-cover" />
          </div>
          {images.length > 1 && (
            <div className="grid grid-cols-4 gap-2">
              {images.map((src, i) => (
                <div key={i} className="aspect-square overflow-hidden rounded bg-muted">
                  <img src={resolveImage(src)} alt="" className="h-full w-full object-cover" />
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          {product.categories && (
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">{product.categories.name}</p>
          )}
          <h1 className="mt-2 font-display text-3xl font-bold md:text-4xl">{product.title}</h1>
          <div className="mt-3 flex items-baseline gap-3">
            <span className="text-2xl font-semibold text-gold">{formatKES(displayPrice)}</span>
            {onSale && <span className="text-sm text-muted-foreground line-through">{formatKES(product.price)}</span>}
          </div>

          <p className="mt-5 text-sm leading-relaxed text-foreground/80">{product.description}</p>

          {sizes.length > 0 && (
            <div className="mt-6">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider">Size</span>
                <button className="text-xs text-gold hover:underline">Size guide</button>
              </div>
              <div className="flex flex-wrap gap-2">
                {sizes.map((s) => {
                  const v = variants.find((x) => x.size === s);
                  const active = activeVariant?.size === s;
                  const oos = !v || v.stock_quantity === 0;
                  return (
                    <button
                      key={s}
                      onClick={() => v && setActiveVariant(v)}
                      disabled={oos}
                      className={cn(
                        "min-w-12 rounded border px-3 py-2 text-sm transition-colors",
                        active ? "border-gold bg-gold text-gold-foreground" : "border-border hover:border-gold",
                        oos && "cursor-not-allowed text-muted-foreground line-through opacity-50",
                      )}
                    >
                      {s}
                    </button>
                  );
                })}
              </div>
              {activeVariant && (
                <p className="mt-2 text-xs text-muted-foreground">
                  {activeVariant.stock_quantity > 5 ? (
                    <span className="text-success">In stock</span>
                  ) : activeVariant.stock_quantity > 0 ? (
                    <span className="text-gold">Only {activeVariant.stock_quantity} left</span>
                  ) : (
                    <span className="text-destructive">Out of stock</span>
                  )}
                </p>
              )}
            </div>
          )}

          <div className="mt-6 flex items-center gap-3">
            <div className="flex items-center rounded border border-border">
              <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="px-3 py-2"><Minus className="h-3 w-3" /></button>
              <span className="w-10 text-center text-sm font-medium">{qty}</span>
              <button onClick={() => setQty((q) => q + 1)} className="px-3 py-2"><Plus className="h-3 w-3" /></button>
            </div>
            <Button variant="default" size="lg" onClick={handleAdd} className="flex-1">Add to cart</Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => wishlist.toggle(product.id)}
              aria-label="Toggle wishlist"
              className={cn("h-11 w-11", wished && "border-gold")}
            >
              <Heart className={cn("h-5 w-5", wished && "fill-gold text-gold")} />
            </Button>
          </div>

          <div className="mt-8 grid grid-cols-3 gap-4 border-t border-border pt-6 text-center">
            <div className="text-xs"><Truck className="mx-auto mb-1 h-5 w-5 text-gold" />Free Nairobi delivery</div>
            <div className="text-xs"><Store className="mx-auto mb-1 h-5 w-5 text-gold" />In-store pickup</div>
            <div className="text-xs"><ShieldCheck className="mx-auto mb-1 h-5 w-5 text-gold" />14-day returns</div>
          </div>
        </div>
      </div>
    </div>
  );
}
