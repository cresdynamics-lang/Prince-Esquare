import { Link } from "@tanstack/react-router";
import { ShoppingBag, Heart, User, Menu, Search, X } from "lucide-react";
import { useState } from "react";
import { useCart } from "@/lib/cart";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { STORE_INFO } from "@/lib/format";

const NAV = [
  { type: "route", to: "/shop", label: "Shop All" },
  { type: "category", slug: "suits", label: "Suits" },
  { type: "category", slug: "shirts", label: "Shirts" },
  { type: "category", slug: "shoes", label: "Shoes" },
  { type: "category", slug: "casual", label: "Casual" },
  { type: "route", to: "/about", label: "About" },
  { type: "route", to: "/contact", label: "Contact" },
] as const;

export function Header() {
  const { count } = useCart();
  const { user, isStaff } = useAuth();
  const [open, setOpen] = useState(false);

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

        <Link to="/" className="flex flex-col leading-none">
          <span className="font-display text-xl font-bold tracking-tight md:text-2xl">
            Prince <span className="text-gold">Esquare</span>
          </span>
          <span className="hidden text-[10px] uppercase tracking-[0.25em] text-muted-foreground md:inline">
            Menswear - Nairobi
          </span>
        </Link>

        <nav className="ml-8 hidden items-center gap-7 lg:flex">
          {NAV.map((n) =>
            n.type === "route" ? (
              <Link
                key={n.label}
                to={n.to}
                className="text-sm font-medium text-foreground/80 transition-colors hover:text-gold"
                activeProps={{ className: "text-gold" }}
              >
                {n.label}
              </Link>
            ) : (
              <Link
                key={n.label}
                to="/category/$slug"
                params={{ slug: n.slug }}
                className="text-sm font-medium text-foreground/80 transition-colors hover:text-gold"
                activeProps={{ className: "text-gold" }}
              >
                {n.label}
              </Link>
            ),
          )}
        </nav>

        <div className="ml-auto flex items-center gap-1 md:gap-2">
          <Link to="/shop" aria-label="Search" className="hidden md:inline-flex">
            <Button variant="ghost" size="icon">
              <Search className="h-5 w-5" />
            </Button>
          </Link>
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
          {isStaff && (
            <Link to="/admin" className="ml-1 hidden md:inline-flex">
              <Button
                variant="outline"
                size="sm"
                className="border-gold text-gold hover:bg-gold/10"
              >
                Admin
              </Button>
            </Link>
          )}
        </div>
      </div>

      {open && (
        <div className="border-t border-border bg-background lg:hidden">
          <nav className="container mx-auto flex flex-col px-4 py-2">
            {NAV.map((n) =>
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
            {isStaff && (
              <Link
                to="/admin"
                onClick={() => setOpen(false)}
                className="py-3 text-sm font-medium text-gold"
              >
                Admin Dashboard
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
