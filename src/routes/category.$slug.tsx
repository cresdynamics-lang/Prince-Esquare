import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ProductCard, type ProductCardData } from "@/components/site/ProductCard";
import { resolveImage } from "@/lib/assetMap";
import { fetchPublishedProductsForCategoryPage } from "@/lib/publishedProductsQuery";
import { getSubcategoriesForCategory, resolveSubcategory } from "@/lib/subcategories";

export const Route = createFileRoute("/category/$slug")({
  component: CategoryPage,
});

function CategoryPage() {
  const PAGE_SIZE = 24;
  const { slug } = Route.useParams();
  const [cat, setCat] = useState<{
    name: string;
    description: string | null;
    image_url: string | null;
  } | null>(null);
  const [products, setProducts] = useState<ProductCardData[]>([]);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [loading, setLoading] = useState(true);
  const [missing, setMissing] = useState(false);
  const [activeSubcategory, setActiveSubcategory] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setMissing(false);

      const { data: c } = await supabase
        .from("categories")
        .select("id,name,description,image_url")
        .eq("slug", slug)
        .maybeSingle();

      if (!c) {
        setMissing(true);
        setLoading(false);
        return;
      }

      setCat(c);

      const { data: ps, error: prodErr } = await fetchPublishedProductsForCategoryPage(supabase, c.id);
      if (prodErr) {
        console.error("[category] products:", prodErr);
        setProducts([]);
        setLoading(false);
        return;
      }

      const dbCards = (ps ?? []).map((p: any) => ({
        id: p.id,
        slug: p.slug,
        title: p.title,
        price: Number(p.price),
        sale_price: p.sale_price != null ? Number(p.sale_price) : null,
        image: p.product_images?.[0]?.image_url ?? null,
        category_name: c.name,
        category_slug: slug,
        subcategory_name: resolveSubcategory(p.subcategory, slug, `${p.title ?? ""} ${p.slug ?? ""}`),
        stock_quantity_total: (p.product_variants ?? []).reduce(
          (sum: number, v: any) => sum + Number(v.stock_quantity ?? 0),
          0,
        ),
      }));
      setProducts(dbCards);
      setLoading(false);
    })();
  }, [slug]);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
    setActiveSubcategory(null);
  }, [slug]);

  const subcategories = getSubcategoriesForCategory(slug);
  const filteredProducts = activeSubcategory
    ? products.filter((p) => p.subcategory_name === activeSubcategory)
    : products;
  const visibleProducts = filteredProducts.slice(0, visibleCount);
  const hasMore = !loading && visibleProducts.length < filteredProducts.length;

  if (missing) {
    return (
      <div className="container mx-auto px-4 py-24 text-center">
        <h1 className="font-display text-4xl font-bold">Category not found</h1>
        <Link to="/shop" className="mt-6 inline-block text-gold hover:underline">
          Browse all {"->"}
        </Link>
      </div>
    );
  }

  return (
    <div>
      <section className="relative overflow-hidden bg-navy text-navy-foreground">
        {cat?.image_url && (
          <div className="absolute inset-0 opacity-30">
            <img src={resolveImage(cat.image_url)} alt="" className="h-full w-full object-cover" />
          </div>
        )}
        <div className="container relative mx-auto px-4 py-16 text-center md:py-24">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gold">
            Collection
          </p>
          <h1 className="mt-3 font-display text-4xl font-bold md:text-6xl">
            {cat?.name ?? "Loading..."}
          </h1>
          {cat?.description && (
            <p className="mx-auto mt-4 max-w-xl text-sm text-navy-foreground/70 md:text-base">
              {cat.description}
            </p>
          )}
        </div>
      </section>

      <div className="container mx-auto px-4 py-12">
        {subcategories.length > 0 && (
          <div className="mb-8 flex flex-wrap justify-center gap-2">
            <button
              onClick={() => setActiveSubcategory(null)}
              className={`rounded-full border px-4 py-1.5 text-xs font-medium transition-colors ${activeSubcategory === null ? "border-gold bg-gold text-gold-foreground" : "border-border hover:border-gold"}`}
            >
              All {cat?.name ?? ""}
            </button>
            {subcategories.map((subcat) => (
              <button
                key={subcat}
                onClick={() => setActiveSubcategory(subcat)}
                className={`rounded-full border px-4 py-1.5 text-xs font-medium transition-colors ${activeSubcategory === subcat ? "border-gold bg-gold text-gold-foreground" : "border-border hover:border-gold"}`}
              >
                {subcat}
              </button>
            ))}
          </div>
        )}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {loading
            ? Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="aspect-[4/5] animate-pulse rounded-md bg-muted" />
              ))
            : visibleProducts.map((p, index) => (
                <ProductCard key={p.id} product={p} eager={index < 1} />
              ))}
        </div>
        {hasMore && (
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

        {!loading && filteredProducts.length === 0 && (
          <p className="py-16 text-center text-muted-foreground">
            No products in this category yet.
          </p>
        )}
      </div>
    </div>
  );
}
