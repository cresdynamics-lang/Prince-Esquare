import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowRight, Truck, Store, Sparkles, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { FashionGallery } from "@/components/site/FashionGallery";
import { ProductCard, type ProductCardData } from "@/components/site/ProductCard";
import { fashionGalleryItems } from "@/lib/fashionGallery";
import { dedupeProductsBySlugPreferOrder, fashionProductsAsCards } from "@/lib/fashionProducts";
import heroImg from "@/assets/hero-suit.jpg";

function pickMixedCategories(products: ProductCardData[], limit: number): ProductCardData[] {
  if (products.length <= limit) return products;

  const buckets = new Map<string, ProductCardData[]>();
  for (const product of products) {
    const key = (product.category_name ?? "other").toLowerCase();
    const list = buckets.get(key) ?? [];
    list.push(product);
    buckets.set(key, list);
  }

  const keys = Array.from(buckets.keys());
  const picked: ProductCardData[] = [];
  let guard = 0;

  while (picked.length < limit && guard < 1000) {
    guard += 1;
    let tookAny = false;
    for (const key of keys) {
      if (picked.length >= limit) break;
      const list = buckets.get(key);
      if (!list || list.length === 0) continue;
      picked.push(list.shift()!);
      tookAny = true;
    }
    if (!tookAny) break;
  }

  return picked;
}

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
  const HOME_SECTION_SIZE = 8;
  const SOCKS_SECTION_SIZE = 4;
  const heroSlides = [
    {
      image: heroImg,
      title: "The Modern Gentleman, Outfitted.",
      body: "Master tailoring, considered fabrics, and timeless silhouettes - crafted for Nairobi&apos;s most discerning men.",
      ctaTo: "/shop" as const,
      ctaLabel: "Shop the Collection",
    },
    {
      image: "/src/assets/cat-suits.jpg",
      title: "Signature Suits Collection",
      body: "Sharp lines, rich textures, and refined silhouettes for events, office, and formal evenings.",
      ctaTo: "/category/$slug" as const,
      ctaLabel: "Explore Suits",
      ctaParams: { slug: "suits" as const },
    },
    {
      image: "/src/assets/cat-shoes.jpg",
      title: "Premium Footwear Edit",
      body: "From polished Oxfords to statement loafers, complete every look with confidence.",
      ctaTo: "/category/$slug" as const,
      ctaLabel: "Shop Shoes",
      ctaParams: { slug: "shoes" as const },
    },
    {
      image: "/src/assets/catalog/shirts/shirts-material-polyester-fibershirts-type-casual.avif",
      title: "New Shirts Drop",
      body: "Fresh casual and formal shirt styles now available as ready-to-shop products.",
      ctaTo: "/category/$slug" as const,
      ctaLabel: "Shop Shirts",
      ctaParams: { slug: "shirts" as const },
    },
    {
      image: "/src/assets/catalog/track-suits/track-suits-mens-track-suits-2-piece-the-track-suit-consists.webp",
      title: "Track Suit Essentials",
      body: "Comfort-first matching sets with clean cuts for training, travel, and everyday style.",
      ctaTo: "/category/$slug" as const,
      ctaLabel: "Shop Track Suits",
      ctaParams: { slug: "track-suits" as const },
    },
  ];
  const [curated, setCurated] = useState<ProductCardData[]>([]);
  const [featured, setFeatured] = useState<ProductCardData[]>([]);
  const [socksHighlights, setSocksHighlights] = useState<ProductCardData[]>([]);
  const [curatedVisibleCount, setCuratedVisibleCount] = useState(HOME_SECTION_SIZE);
  const [featuredVisibleCount, setFeaturedVisibleCount] = useState(HOME_SECTION_SIZE);
  const [activeSlide, setActiveSlide] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const id = window.setInterval(() => {
      setActiveSlide((s) => (s + 1) % heroSlides.length);
    }, 4500);
    return () => window.clearInterval(id);
  }, [heroSlides.length]);

  useEffect(() => {
    (async () => {
      try {
        const [{ data: featuredProds }, { data: curatedProds }] = await Promise.all([
          supabase
            .from("products")
            .select(
              "id,slug,title,price,sale_price,is_featured,product_images(image_url),categories(name,slug)",
            )
            .eq("is_published", true)
            .eq("is_featured", true)
            .limit(16),
          supabase
            .from("products")
            .select("id,slug,title,price,sale_price,product_images(image_url),categories(name,slug)")
            .eq("is_published", true)
            .order("created_at", { ascending: false })
            .limit(16),
        ]);

        let prods = featuredProds ?? [];
        if (prods.length === 0) {
          const { data: latestProducts } = await supabase
            .from("products")
            .select("id,slug,title,price,sale_price,product_images(image_url),categories(name,slug)")
            .eq("is_published", true)
            .order("created_at", { ascending: false })
            .limit(16);
          prods = latestProducts ?? [];
        }

        const mappedCurated = (curatedProds ?? []).map((p: any) => ({
          id: p.id,
          slug: p.slug,
          title: p.title,
          price: Number(p.price),
          sale_price: p.sale_price != null ? Number(p.sale_price) : null,
          image: p.product_images?.[0]?.image_url ?? null,
          category_name: p.categories?.name,
          category_slug: p.categories?.slug,
        }));
        const mappedFeatured = prods.map((p: any) => ({
          id: p.id,
          slug: p.slug,
          title: p.title,
          price: Number(p.price),
          sale_price: p.sale_price != null ? Number(p.sale_price) : null,
          image: p.product_images?.[0]?.image_url ?? null,
          category_name: p.categories?.name,
          category_slug: p.categories?.slug,
        }));
        const fashionCards = fashionProductsAsCards();
        const curatedMerged = dedupeProductsBySlugPreferOrder([...mappedCurated, ...fashionCards]);
        const featuredMerged = dedupeProductsBySlugPreferOrder([...mappedFeatured, ...fashionCards]);
        const curatedList = pickMixedCategories(curatedMerged, 16);
        const featuredList = pickMixedCategories(featuredMerged, 16);
        const socksList = [...featuredMerged, ...curatedMerged]
          .filter((product) => {
            const slugMatch = product.category_slug?.toLowerCase() === "socks";
            const nameMatch = product.category_name?.toLowerCase() === "socks";
            return slugMatch || nameMatch;
          })
          .slice(0, SOCKS_SECTION_SIZE);
        setCurated(curatedList);
        setFeatured(featuredList);
        setSocksHighlights(socksList);
      } catch (error) {
        console.error("Failed to load homepage products", error);
        setCurated([]);
        setFeatured([]);
        setSocksHighlights([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const visibleCurated = curated.slice(0, curatedVisibleCount);
  const visibleFeatured = featured.slice(0, featuredVisibleCount);
  const hasMoreCurated = !loading && visibleCurated.length < curated.length;
  const hasMoreFeatured = !loading && visibleFeatured.length < featured.length;

  return (
    <div className="fade-in">
      <section className="relative overflow-hidden bg-navy text-navy-foreground">
        <div className="absolute inset-0">
          {heroSlides.map((slide, idx) => (
            <img
              key={slide.title}
              src={slide.image}
              alt={slide.title}
              className={`absolute inset-0 h-full w-full object-cover object-right transition-opacity duration-700 ${idx === activeSlide ? "opacity-80" : "opacity-0"}`}
              loading={idx === 0 ? "eager" : "lazy"}
              decoding="async"
              width={1920}
              height={1080}
            />
          ))}
          <div className="absolute inset-0 bg-gradient-to-r from-navy via-navy/80 to-transparent" />
        </div>
        <div className="container relative mx-auto px-4 py-24 md:py-36 lg:py-44">
          <div className="max-w-xl">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gold">
              Autumn Collection - 2026
            </p>
            <h1 className="mt-4 font-display text-4xl font-bold leading-[1.05] md:text-6xl lg:text-7xl">
              {heroSlides[activeSlide]?.title.includes("Gentleman") ? (
                <>
                  The Modern <span className="text-gold">Gentleman</span>, Outfitted.
                </>
              ) : (
                heroSlides[activeSlide]?.title
              )}
            </h1>
            <p className="mt-5 max-w-md text-base text-navy-foreground/80 md:text-lg">
              {heroSlides[activeSlide]?.body}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              {heroSlides[activeSlide]?.ctaTo === "/shop" ? (
                <Link to="/shop">
                  <Button variant="hero" size="lg">
                    {heroSlides[activeSlide]?.ctaLabel} <ArrowRight className="ml-1 h-4 w-4" />
                  </Button>
                </Link>
              ) : (
                <Link to="/category/$slug" params={heroSlides[activeSlide]?.ctaParams ?? { slug: "suits" }}>
                  <Button variant="hero" size="lg">
                    {heroSlides[activeSlide]?.ctaLabel} <ArrowRight className="ml-1 h-4 w-4" />
                  </Button>
                </Link>
              )}
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
            <div className="mt-6 flex items-center gap-2">
              {heroSlides.map((slide, idx) => (
                <button
                  key={slide.title}
                  type="button"
                  onClick={() => setActiveSlide(idx)}
                  aria-label={`Go to slide ${idx + 1}`}
                  className={`h-2.5 rounded-full transition-all ${idx === activeSlide ? "w-8 bg-gold" : "w-2.5 bg-navy-foreground/50"}`}
                />
              ))}
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
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {loading
            ? Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="aspect-[4/5] animate-pulse rounded-md bg-muted" />
              ))
            : visibleCurated.map((p, index) => (
                <ProductCard key={p.id} product={p} eager={index < 1} />
              ))}
        </div>
        {hasMoreCurated && (
          <div className="mt-8 text-center">
            <button
              type="button"
              onClick={() => setCuratedVisibleCount((n) => n + HOME_SECTION_SIZE)}
              className="rounded-md border border-border px-6 py-2 text-sm font-medium transition-colors hover:border-gold hover:text-gold"
            >
              Load more
            </button>
          </div>
        )}
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
              : visibleFeatured.map((p, index) => (
                  <ProductCard key={p.id} product={p} eager={index < 1} />
                ))}
          </div>
          {hasMoreFeatured && (
            <div className="mt-8 text-center">
              <button
                type="button"
                onClick={() => setFeaturedVisibleCount((n) => n + HOME_SECTION_SIZE)}
                className="rounded-md border border-border px-6 py-2 text-sm font-medium transition-colors hover:border-gold hover:text-gold"
              >
                Load more
              </button>
            </div>
          )}
          <div className="mt-10 text-center">
            <Link to="/shop">
              <Button variant="default" size="lg">
                Browse All Products <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {!loading && socksHighlights.length > 0 && (
        <section className="container mx-auto px-4 pb-6 pt-14 md:pt-16">
          <div className="mb-8 flex items-end justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gold">
                Essentials
              </p>
              <h2 className="mt-2 font-display text-2xl font-bold md:text-3xl">
                Socks Highlights
              </h2>
            </div>
            <Link
              to="/category/$slug"
              params={{ slug: "socks" }}
              className="hidden text-sm font-medium text-foreground/70 hover:text-gold md:inline-flex"
            >
              Shop socks {"->"}
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {socksHighlights.map((p, index) => (
              <ProductCard key={p.id} product={p} eager={index < 1} />
            ))}
          </div>
        </section>
      )}

      <FashionGallery
        items={fashionGalleryItems}
        limit={8}
        eyebrow="Studio Gallery"
        title="Fresh From The Fashion Rail"
        description="The same looks from your fashions folder are listed as products in the shop. This grid is an extra visual browse of the rail."
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
