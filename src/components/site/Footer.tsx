import { Link } from "@tanstack/react-router";
import { Instagram, Facebook, Music2, MapPin, Phone, Mail, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { STORE_INFO } from "@/lib/format";
import { useAuth } from "@/lib/auth";
import logoImg from "@/assets/Prince logo.png";

const SHOP_CATEGORIES = [
  { label: "Shoes", slug: "shoes" },
  { label: "Socks", slug: "socks" },
  { label: "Suits", slug: "suits" },
  { label: "Shirts", slug: "shirts" },
  { label: "Trousers", slug: "trousers" },
  { label: "Khaki Pants", slug: "khaki-pants" },
  { label: "Track Suits", slug: "track-suits" },
] as const;

export function Footer() {
  const { isStaff } = useAuth();
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setSubmitting(true);
    const { error } = await supabase
      .from("newsletter_subscribers")
      .insert({ email: email.trim().toLowerCase() });
    setSubmitting(false);
    if (error) {
      if (error.code === "23505") {
        toast.success("You're already on our list - thank you!");
      } else {
        toast.error("Could not subscribe. Please check your email and try again.");
      }
      return;
    }
    toast.success("Welcome to the Esquare circle.");
    setEmail("");
  };

  return (
    <footer className="bg-navy text-navy-foreground">
      <div className="container mx-auto px-4 py-8">
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <div className="flex items-center gap-2.5">
              <img
                src={logoImg}
                alt="Prince Esquare logo"
                className="h-8 w-8 rounded-full border border-gold/40 object-cover"
                width={32}
                height={32}
                loading="lazy"
                decoding="async"
              />
              <div className="font-display text-lg font-bold">
                Prince <span className="text-gold">Esquare</span>
              </div>
            </div>
            <p className="mt-1.5 text-[11px] text-navy-foreground/70">
              {STORE_INFO.tagline} Premium menswear, crafted for the modern Nairobi gentleman.
            </p>
            <div className="mt-2.5 flex gap-2">
              <a
                href={STORE_INFO.socials.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full border border-navy-foreground/20 p-2 text-navy-foreground/70 transition-colors hover:border-gold hover:text-gold"
                aria-label="Instagram"
              >
                <Instagram className="h-4 w-4" />
              </a>
              <a
                href={STORE_INFO.socials.facebook}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full border border-navy-foreground/20 p-2 text-navy-foreground/70 transition-colors hover:border-gold hover:text-gold"
                aria-label="Facebook"
              >
                <Facebook className="h-4 w-4" />
              </a>
              <a
                href={STORE_INFO.socials.tiktok}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full border border-navy-foreground/20 p-2 text-navy-foreground/70 transition-colors hover:border-gold hover:text-gold"
                aria-label="TikTok"
              >
                <Music2 className="h-4 w-4" />
              </a>
            </div>
          </div>

          <div>
            <h4 className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gold">Shop</h4>
            <ul className="mt-2.5 space-y-1 text-[11px] text-navy-foreground/70">
              {SHOP_CATEGORIES.map((category) => (
                <li key={category.slug}>
                  <Link
                    to="/category/$slug"
                    params={{ slug: category.slug }}
                    className="hover:text-gold"
                  >
                    {category.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gold">Visit</h4>
            <ul className="mt-2.5 space-y-1.5 text-[11px] text-navy-foreground/70">
              <li className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
                <span>{STORE_INFO.address}</span>
              </li>
              <li className="flex items-start gap-2">
                <Phone className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
                <a href={`tel:${STORE_INFO.phone}`} className="hover:text-gold">
                  {STORE_INFO.phone}
                </a>
              </li>
              <li className="flex items-start gap-2">
                <Mail className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
                <a href={`mailto:${STORE_INFO.email}`} className="hover:text-gold">
                  {STORE_INFO.email}
                </a>
              </li>
              <li className="text-[11px] text-navy-foreground/50">{STORE_INFO.hours}</li>
              <li>
                <Link to="/store-locator" className="text-gold hover:underline">
                  Store locator {"->"}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gold">
              Newsletter
            </h4>
            <p className="mt-2.5 text-[11px] text-navy-foreground/70">
              First access to new collections and private events.
            </p>
            <form onSubmit={handleSubscribe} className="mt-2.5 flex gap-2">
              <Input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="border-navy-foreground/20 bg-navy-foreground/5 text-navy-foreground placeholder:text-navy-foreground/40"
              />
              <Button type="submit" variant="gold" size="sm" disabled={submitting}>
                Join
              </Button>
            </form>
          </div>
        </div>

        <div className="mt-6 border-t border-navy-foreground/15 pt-3 text-[10px] text-navy-foreground/50">
          <div className="grid items-center gap-3 md:grid-cols-3">
            <p className="text-center md:text-left">
              (c) {new Date().getFullYear()} Prince Esquare. All rights reserved.
            </p>
            <div className="flex justify-center">
              <Link
                to={isStaff ? "/admin" : "/admin-login"}
                aria-label="Admin"
                className="rounded-full border border-navy-foreground/20 p-2 text-gold transition-colors hover:border-gold hover:bg-gold/10"
              >
                <ShieldCheck className="h-4 w-4" />
              </Link>
            </div>
            <div className="flex justify-center gap-5 md:justify-end">
            <Link to="/about" className="hover:text-gold">
              About
            </Link>
            <Link to="/booking" className="hover:text-gold">
              Booking
            </Link>
            <Link to="/contact" className="hover:text-gold">
              Contact
            </Link>
            <Link to="/store-locator" className="hover:text-gold">
              Find us
            </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
