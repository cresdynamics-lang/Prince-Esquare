import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ProductCard, type ProductCardData } from "@/components/site/ProductCard";

export const Route = createFileRoute("/shop")({
  validateSearch: (search: Record<string, unknown>) => ({
    q: typeof search.q === "string" ? search.q : "",
  }),
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
  const { q } = Route.useSearch();
  const PAGE_SIZE = 24;
  const [products, setProducts] = useState<ProductCardData[]>([]);
  const [productCategoryMap, setProductCategoryMap] = useState<Record<string, string | null>>({});
  const [cats, setCats] = useState<{ id: string; slug: string; name: string }[]>([]);
  const [activeCat, setActiveCat] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
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
      const categories = cs ?? [];
      setCats(categories);
      const dbCards: ProductCardData[] = (ps ?? []).map((p: any) => ({
        id: p.id,
        slug: p.slug,
        title: p.title,
        price: Number(p.price),
        sale_price: p.sale_price != null ? Number(p.sale_price) : null,
        image: p.product_images?.[0]?.image_url ?? null,
        category_name: p.categories?.name,
      }));

      const categoryMap: Record<string, string | null> = {};
      (ps ?? []).forEach((p: any) => {
        categoryMap[p.id] = p.category_id ?? null;
      });
      setProductCategoryMap(categoryMap);
      setProducts(dbCards);
      setLoading(false);
    })();
  }, []);

  const filtered = useMemo(
    () =>
      (activeCat
        ? products.filter((p) => {
            if (productCategoryMap[p.id] === activeCat) return true;
            const cat = cats.find((c) => c.id === activeCat);
            if (!cat || !p.category_slug) return false;
            return p.category_slug === cat.slug;
          })
        : products).filter((p) => {
        const term = q.trim().toLowerCase();
        if (!term) return true;
        const titleMatch = p.title.toLowerCase().includes(term);
        const slugMatch = p.slug.toLowerCase().includes(term);
        const categoryMatch = (p.category_name ?? "").toLowerCase().includes(term);
        return titleMatch || slugMatch || categoryMatch;
      }),
    [activeCat, cats, productCategoryMap, products, q],
  );

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [activeCat]);

  const visibleProducts = filtered.slice(0, visibleCount);
  const hasMore = visibleProducts.length < filtered.length;

  return (
    <>
      <div className="container mx-auto px-4 py-12 md:py-16">
        <div className="mb-8 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gold">
            The Collection
          </p>
          <h1 className="mt-2 font-display text-4xl font-bold md:text-5xl">Shop All</h1>
          <div className="gold-divider mx-auto mt-4 w-24" />
          {q.trim() && (
            <p className="mt-3 text-sm text-muted-foreground">
              Search results for <span className="font-semibold text-foreground">"{q}"</span>
            </p>
          )}
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
            : visibleProducts.map((p, index) => (
                <ProductCard key={p.id} product={p} eager={index < 1} />
              ))}
        </div>

        {!loading && hasMore && (
          <div className="mt-8 text-center">
            <button
              type="button"
              onClick={() => setVisibleCount((n) => n + PAGE_SIZE)}
              className="rounded-md border border-border px-6 py-2 text-sm font-medium transition-colors hover:border-gold hover:text-gold"
            >
              Load more products
            </button>
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <p className="py-16 text-center text-muted-foreground">
            No products in this category yet.{" "}
            <Link to="/shop" className="text-gold hover:underline">
              View all
            </Link>
          </p>
        )}
      </div>

    </>
  );
}
