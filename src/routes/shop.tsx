import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { FashionGallery } from "@/components/site/FashionGallery";
import { ProductCard, type ProductCardData } from "@/components/site/ProductCard";
import { fashionGalleryItems } from "@/lib/fashionGallery";

export const Route = createFileRoute("/shop")({
  head: () => ({
    meta: [
      { title: "Shop All Menswear - Prince Esquare" },
      {
        name: "description",
        content:
          "Browse the full Prince Esquare menswear collection - suits, shirts, shoes, casual and more.",
      },
    ],
  }),
  component: ShopPage,
});

function ShopPage() {
  const [products, setProducts] = useState<ProductCardData[]>([]);
  const [cats, setCats] = useState<{ id: string; slug: string; name: string }[]>([]);
  const [activeCat, setActiveCat] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const [{ data: cs }, { data: ps }] = await Promise.all([
        supabase.from("categories").select("id,slug,name").order("display_order"),
        supabase
          .from("products")
          .select(
            "id,slug,title,price,sale_price,category_id,product_images(image_url),categories(name)",
          )
          .eq("is_published", true)
          .order("created_at", { ascending: false }),
      ]);
      setCats(cs ?? []);
      setProducts(
        (ps ?? []).map((p: any) => ({
          id: p.id,
          slug: p.slug,
          title: p.title,
          price: Number(p.price),
          sale_price: p.sale_price != null ? Number(p.sale_price) : null,
          image: p.product_images?.[0]?.image_url ?? null,
          category_name: p.categories?.name,
        })),
      );
      setLoading(false);
    })();
  }, []);

  const filtered = activeCat
    ? products.filter((p) => p.category_name === cats.find((c) => c.id === activeCat)?.name)
    : products;

  return (
    <>
      <div className="container mx-auto px-4 py-12 md:py-16">
        <div className="mb-8 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gold">
            The Collection
          </p>
          <h1 className="mt-2 font-display text-4xl font-bold md:text-5xl">Shop All</h1>
          <div className="gold-divider mx-auto mt-4 w-24" />
        </div>

        <div className="mb-8 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => setActiveCat(null)}
            className={`rounded-full border px-4 py-1.5 text-xs font-medium transition-colors ${activeCat === null ? "border-gold bg-gold text-gold-foreground" : "border-border hover:border-gold"}`}
          >
            All
          </button>
          {cats.map((c) => (
            <button
              key={c.id}
              onClick={() => setActiveCat(c.id)}
              className={`rounded-full border px-4 py-1.5 text-xs font-medium transition-colors ${activeCat === c.id ? "border-gold bg-gold text-gold-foreground" : "border-border hover:border-gold"}`}
            >
              {c.name}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {loading
            ? Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="aspect-[4/5] animate-pulse rounded-md bg-muted" />
              ))
            : filtered.map((p, index) => <ProductCard key={p.id} product={p} eager={index < 4} />)}
        </div>

        {!loading && filtered.length === 0 && (
          <p className="py-16 text-center text-muted-foreground">
            No live products in this category yet.{" "}
            <Link to="/shop" className="text-gold hover:underline">
              View all
            </Link>
          </p>
        )}
      </div>

      <FashionGallery
        id="studio-gallery"
        items={fashionGalleryItems}
        eyebrow="Studio Gallery"
        title="Bundled Fashion Visuals"
        description="These images are loaded from your local fashions folder so the collection is visible on the site even before every item is entered into Supabase."
        className="bg-secondary/40"
      />
    </>
  );
}
