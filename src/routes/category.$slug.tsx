import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { FashionGallery } from "@/components/site/FashionGallery";
import { ProductCard, type ProductCardData } from "@/components/site/ProductCard";
import { resolveImage } from "@/lib/assetMap";
import {
  getFashionCategoryFallback,
  getFashionGalleryForSlug,
  type FashionGalleryItem,
} from "@/lib/fashionGallery";

export const Route = createFileRoute("/category/$slug")({
  component: CategoryPage,
  notFoundComponent: () => (
    <div className="container mx-auto px-4 py-24 text-center">
      <h1 className="font-display text-4xl font-bold">Category not found</h1>
      <Link to="/shop" className="mt-6 inline-block text-gold hover:underline">
        Browse all {"->"}
      </Link>
    </div>
  ),
});

function CategoryPage() {
  const { slug } = Route.useParams();
  const fallbackCategory = getFashionCategoryFallback(slug);
  const initialGallery = getFashionGalleryForSlug(slug);
  const [cat, setCat] = useState<{
    name: string;
    description: string | null;
    image_url: string | null;
  } | null>(fallbackCategory);
  const [products, setProducts] = useState<ProductCardData[]>([]);
  const [galleryItems, setGalleryItems] = useState<FashionGalleryItem[]>(initialGallery);
  const [loading, setLoading] = useState(!fallbackCategory);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setMissing(false);

      const localFallbackCategory = getFashionCategoryFallback(slug);
      const localGallery = getFashionGalleryForSlug(slug);

      setGalleryItems(localGallery);

      const { data: c } = await supabase
        .from("categories")
        .select("id,name,description,image_url")
        .eq("slug", slug)
        .maybeSingle();

      if (!c) {
        if (localFallbackCategory) {
          setCat(localFallbackCategory);
          setProducts([]);
          setLoading(false);
          return;
        }

        setMissing(true);
        setLoading(false);
        return;
      }

      setCat({
        ...c,
        description: c.description ?? localFallbackCategory?.description ?? null,
        image_url: c.image_url ?? localFallbackCategory?.image_url ?? null,
      });

      const { data: ps } = await supabase
        .from("products")
        .select("id,slug,title,price,sale_price,product_images(image_url)")
        .eq("category_id", c.id)
        .eq("is_published", true);

      setProducts(
        (ps ?? []).map((p: any) => ({
          id: p.id,
          slug: p.slug,
          title: p.title,
          price: Number(p.price),
          sale_price: p.sale_price != null ? Number(p.sale_price) : null,
          image: p.product_images?.[0]?.image_url ?? null,
          category_name: c.name,
        })),
      );
      setLoading(false);
    })();
  }, [slug]);

  if (missing) throw notFound();

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
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {loading
            ? Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="aspect-[4/5] animate-pulse rounded-md bg-muted" />
              ))
            : products.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>

        {!loading && products.length === 0 && galleryItems.length === 0 && (
          <p className="py-16 text-center text-muted-foreground">
            No products in this category yet.
          </p>
        )}
      </div>

      {!loading && galleryItems.length > 0 && (
        <FashionGallery
          items={galleryItems}
          eyebrow="Studio Gallery"
          title={`More ${cat?.name ?? "Collection"} Visuals`}
          description="These images come from your bundled fashions folder and now appear directly inside the matching collection page."
          className="pt-0"
        />
      )}
    </div>
  );
}
