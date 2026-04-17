import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowRight, Truck, Store, Sparkles, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { FashionGallery } from "@/components/site/FashionGallery";
import { ProductCard, type ProductCardData } from "@/components/site/ProductCard";
import { resolveImage } from "@/lib/assetMap";
import { fashionGalleryItems } from "@/lib/fashionGallery";
import heroImg from "@/assets/hero-suit.jpg";

type CategoryRow = {
  id: string;
  slug: string;
  name: string;
  image_url: string | null;
};

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Prince Esquare - Premium Menswear in Nairobi" },
      {
        name: "description",
        content:
          "Discover tailored suits, dress shirts, leather shoes and more. Premium menswear delivered free across Nairobi.",
      },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [featured, setFeatured] = useState<ProductCardData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [{ data: cats }, { data: prods }] = await Promise.all([
        supabase.from("categories").select("id,slug,name,image_url").order("display_order"),
        supabase
          .from("products")
          .select(
            "id,slug,title,price,sale_price,is_featured,product_images(image_url),categories(name)",
          )
          .eq("is_published", true)
          .eq("is_featured", true)
          .limit(8),
      ]);
      setCategories(cats ?? []);
      setFeatured(
        (prods ?? []).map((p: any) => ({
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

  return (
    <div className="fade-in">
      <section className="relative overflow-hidden bg-navy text-navy-foreground">
        <div className="absolute inset-0">
          <img
            src={heroImg}
            alt="A gentleman in a tailored navy three-piece suit"
            className="h-full w-full object-cover object-right opacity-80"
            width={1920}
            height={1080}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-navy via-navy/80 to-transparent" />
        </div>
        <div className="container relative mx-auto px-4 py-24 md:py-36 lg:py-44">
          <div className="max-w-xl">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gold">
              Autumn Collection - 2026
            </p>
            <h1 className="mt-4 font-display text-4xl font-bold leading-[1.05] md:text-6xl lg:text-7xl">
              The Modern <span className="text-gold">Gentleman</span>, Outfitted.
            </h1>
            <p className="mt-5 max-w-md text-base text-navy-foreground/80 md:text-lg">
              Master tailoring, considered fabrics, and timeless silhouettes - crafted for
              Nairobi&apos;s most discerning men.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/shop">
                <Button variant="hero" size="lg">
                  Shop the Collection <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </Link>
              <Link to="/category/$slug" params={{ slug: "suits" }}>
                <Button
                  variant="outline"
                  size="lg"
                  className="border-navy-foreground/30 bg-transparent text-navy-foreground hover:bg-navy-foreground/10"
                >
                  Explore Suits
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-16 md:py-24">
        <div className="mb-10 flex items-end justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gold">
              Curated Edits
            </p>
            <h2 className="mt-2 font-display text-3xl font-bold md:text-4xl">
              Shop by Category
            </h2>
          </div>
          <Link
            to="/shop"
            className="hidden text-sm font-medium text-foreground/70 hover:text-gold md:inline-flex"
          >
            View all {"->"}
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-5 lg:grid-cols-5">
          {categories.slice(0, 5).map((c, index) => (
            <Link
              key={c.id}
              to="/category/$slug"
              params={{ slug: c.slug }}
              className="product-card group relative aspect-[3/4] overflow-hidden rounded-md bg-muted"
            >
              <img
                src={resolveImage(c.image_url)}
                alt={c.name}
                loading={index < 3 ? "eager" : "lazy"}
                decoding="async"
                width={400}
                height={533}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-navy/80 via-navy/10 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-4">
                <h3 className="font-display text-lg font-bold text-navy-foreground md:text-xl">
                  {c.name}
                </h3>
                <p className="mt-0.5 text-xs text-gold">Shop now {"->"}</p>
              </div>
            </Link>
          ))}
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-5">
          {categories.slice(5).map((c) => (
            <Link
              key={c.id}
              to="/category/$slug"
              params={{ slug: c.slug }}
              className="product-card group relative aspect-[5/3] overflow-hidden rounded-md bg-muted"
            >
              <img
                src={resolveImage(c.image_url)}
                alt={c.name}
                loading="lazy"
                decoding="async"
                width={400}
                height={240}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-navy/80 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-3">
                <h3 className="font-display text-base font-bold text-navy-foreground">
                  {c.name}
                </h3>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="bg-secondary/40 py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="mb-10 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gold">
              Hand-picked
            </p>
            <h2 className="mt-2 font-display text-3xl font-bold md:text-4xl">
              Featured Pieces
            </h2>
            <div className="gold-divider mx-auto mt-4 w-24" />
          </div>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {loading
              ? Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="aspect-[4/5] animate-pulse rounded-md bg-muted" />
                ))
              : featured.map((p, index) => <ProductCard key={p.id} product={p} eager={index < 4} />)}
          </div>
          <div className="mt-10 text-center">
            <Link to="/shop">
              <Button variant="default" size="lg">
                Browse All Products <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <FashionGallery
        items={fashionGalleryItems}
        limit={8}
        eyebrow="Studio Gallery"
        title="Fresh From The Fashion Rail"
        description="Your latest bundled fashion images now surface directly on the website as a visual collection."
      />

      <section className="container mx-auto px-4 py-16 md:py-24">
        <div className="mb-12 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gold">
            The Esquare Promise
          </p>
          <h2 className="mt-2 font-display text-3xl font-bold md:text-4xl">
            Why Prince Esquare
          </h2>
        </div>
        <div className="grid gap-8 md:grid-cols-4">
          {[
            {
              icon: Sparkles,
              title: "Master Tailoring",
              body: "Considered fabrics, half-canvas construction, modern silhouettes.",
            },
            {
              icon: Truck,
              title: "Free Nairobi Delivery",
              body: "Complimentary delivery on all orders within Nairobi.",
            },
            {
              icon: Store,
              title: "In-Store Pickup",
              body: "Skip delivery - collect at our Kimathi Street store.",
            },
            {
              icon: ShieldCheck,
              title: "Quality Guarantee",
              body: "Easy 14-day returns and an honest fit promise.",
            },
          ].map((f) => (
            <div key={f.title} className="text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-gold/40 bg-gold/10 text-gold">
                <f.icon className="h-6 w-6" />
              </div>
              <h3 className="mt-4 font-display text-lg font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{f.body}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
