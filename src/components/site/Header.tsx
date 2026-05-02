import { Link, useNavigate } from "@tanstack/react-router";
import { ShoppingBag, Heart, User, Menu, Search, X } from "lucide-react";
import { useState } from "react";
import { useCart } from "@/lib/cart";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { STORE_INFO } from "@/lib/format";
import { CATALOG_TAXONOMY, PRIMARY_NAV_CATEGORY_SLUGS } from "@/lib/catalogTaxonomy";
import logoImg from "@/assets/Prince logo.png";

const NAV = [{ type: "route", to: "/shop", label: "Shop All" }] as const;
const PRIMARY_CATEGORY_LINKS = CATALOG_TAXONOMY.filter((item) =>
  PRIMARY_NAV_CATEGORY_SLUGS.includes(item.slug as (typeof PRIMARY_NAV_CATEGORY_SLUGS)[number]),
).map((item) => ({ type: "category" as const, slug: item.slug, label: item.name }));
const MORE_NAV = [
  ...CATALOG_TAXONOMY.filter(
    (item) => !PRIMARY_NAV_CATEGORY_SLUGS.includes(item.slug as (typeof PRIMARY_NAV_CATEGORY_SLUGS)[number]),
  ).map((item) => ({ type: "category" as const, slug: item.slug, label: item.name })),
  { type: "route", to: "/booking", label: "Booking" },
  { type: "route", to: "/contact", label: "Contact" },
] as const;

export function Header() {
  const { count } = useCart();
  const { user, isStaff } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchTerm.trim();
    navigate({
      to: "/shop",
      search: q ? { q } : {},
    });
    setSearchOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="container mx-auto flex h-16 items-center gap-4 px-4 md:h-20">
        <button
          onClick={() => setOpen((v) => !v)}
          className="lg:hidden"
          aria-label="Toggle menu"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>

        <Link to="/" className="flex items-center gap-3 leading-none">
          <img
            src={logoImg}
            alt="Prince Esquire logo"
            className="h-10 w-10 rounded-full border border-gold/50 object-cover"
            width={40}
            height={40}
          />
          <span className="flex flex-col">
            <span className="font-display text-xl font-bold tracking-tight md:text-2xl">
            Prince <span className="text-gold">Esquire</span>
            </span>
            <span className="hidden text-[10px] uppercase tracking-[0.25em] text-muted-foreground md:inline">
              Menswear - Nairobi
            </span>
          </span>
        </Link>

        <nav className="ml-6 hidden items-center gap-4 xl:gap-5 lg:flex">
          {[...NAV, ...PRIMARY_CATEGORY_LINKS].map((n) =>
            n.type === "route" ? (
              <Link
                key={n.label}
                to={n.to}
                className="text-xs xl:text-sm font-medium text-foreground/80 transition-colors hover:text-gold"
                activeProps={{ className: "text-gold" }}
              >
                {n.label}
              </Link>
            ) : (
              <Link
                key={n.label}
                to="/category/$slug"
                params={{ slug: n.slug }}
                className="text-xs xl:text-sm font-medium text-foreground/80 transition-colors hover:text-gold"
                activeProps={{ className: "text-gold" }}
              >
                {n.label}
              </Link>
            ),
          )}
          <details className="group relative">
            <summary className="list-none cursor-pointer text-xs xl:text-sm font-medium text-foreground/80 transition-colors hover:text-gold">
              More
            </summary>
            <div className="absolute left-0 top-7 z-50 min-w-40 rounded-md border border-border bg-background p-2 shadow-lg">
              {MORE_NAV.map((n) =>
                n.type === "route" ? (
                  <Link
                    key={n.label}
                    to={n.to}
                    className="block rounded px-2 py-1.5 text-xs xl:text-sm text-foreground/80 hover:bg-muted hover:text-gold"
                  >
                    {n.label}
                  </Link>
                ) : (
                  <Link
                    key={n.label}
                    to="/category/$slug"
                    params={{ slug: n.slug }}
                    className="block rounded px-2 py-1.5 text-xs xl:text-sm text-foreground/80 hover:bg-muted hover:text-gold"
                  >
                    {n.label}
                  </Link>
                ),
              )}
            </div>
          </details>
        </nav>

        <div className="ml-auto flex items-center gap-1 md:gap-2">
          <Button
            variant="ghost"
            size="icon"
            type="button"
            aria-label="Search"
            className="hidden md:inline-flex"
            onClick={() => setSearchOpen((v) => !v)}
          >
            <Search className="h-5 w-5" />
          </Button>
          <Link to="/wishlist" aria-label="Wishlist">
            <Button variant="ghost" size="icon">
              <Heart className="h-5 w-5" />
            </Button>
          </Link>
          <Link to="/account" aria-label="Account">
            <Button variant="ghost" size="icon">
              <User className="h-5 w-5" />
            </Button>
          </Link>
          <Link to="/cart" aria-label="Cart" className="relative">
            <Button variant="ghost" size="icon">
              <ShoppingBag className="h-5 w-5" />
              {count > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-gold px-1 text-[10px] font-bold text-gold-foreground">
                  {count}
                </span>
              )}
            </Button>
          </Link>
        </div>
      </div>

      {searchOpen && (
        <div className="border-t border-border bg-background/95 px-4 py-3">
          <form onSubmit={submitSearch} className="container mx-auto flex items-center gap-2">
            <input
              autoFocus
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search products by name, slug, or category..."
              className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
            <Button type="submit" size="sm">
              Search
            </Button>
          </form>
        </div>
      )}

      {open && (
        <div className="border-t border-border bg-background lg:hidden">
          <nav className="container mx-auto flex flex-col px-4 py-2">
            {[...NAV, ...PRIMARY_CATEGORY_LINKS, ...MORE_NAV].map((n) =>
              n.type === "route" ? (
                <Link
                  key={n.label}
                  to={n.to}
                  onClick={() => setOpen(false)}
                  className="border-b border-border/60 py-3 text-sm font-medium last:border-b-0"
                >
                  {n.label}
                </Link>
              ) : (
                <Link
                  key={n.label}
                  to="/category/$slug"
                  params={{ slug: n.slug }}
                  onClick={() => setOpen(false)}
                  className="border-b border-border/60 py-3 text-sm font-medium last:border-b-0"
                >
                  {n.label}
                </Link>
              ),
            )}
            {!user && (
              <Link
                to="/auth"
                onClick={() => setOpen(false)}
                className="py-3 text-sm font-medium text-gold"
              >
                Sign in / Create account
              </Link>
            )}
            <a
              href={`https://wa.me/${STORE_INFO.whatsapp}`}
              target="_blank"
              rel="noopener noreferrer"
              className="py-3 text-sm font-medium text-success"
            >
              WhatsApp us
            </a>
          </nav>
        </div>
      )}
    </header>
  );
}
