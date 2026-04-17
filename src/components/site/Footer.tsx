import { Link } from "@tanstack/react-router";
import { Instagram, Facebook, Music2, MapPin, Phone, Mail } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { STORE_INFO } from "@/lib/format";

export function Footer() {
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
        toast.success("You're already on our list — thank you!");
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
      <div className="container mx-auto px-4 py-16">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <div className="font-display text-2xl font-bold">
              Prince <span className="text-gold">Esquare</span>
            </div>
            <p className="mt-3 text-sm text-navy-foreground/70">
              {STORE_INFO.tagline} Premium menswear, crafted for the modern Nairobi gentleman.
            </p>
            <div className="mt-5 flex gap-3">
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
            <h4 className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">Shop</h4>
            <ul className="mt-4 space-y-2 text-sm text-navy-foreground/70">
              <li><Link to="/category/suits" className="hover:text-gold">Suits</Link></li>
              <li><Link to="/category/shirts" className="hover:text-gold">Shirts</Link></li>
              <li><Link to="/category/trousers" className="hover:text-gold">Trousers</Link></li>
              <li><Link to="/category/shoes" className="hover:text-gold">Shoes</Link></li>
              <li><Link to="/category/casual" className="hover:text-gold">Casual</Link></li>
              <li><Link to="/category/formal" className="hover:text-gold">Formal</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">Visit</h4>
            <ul className="mt-4 space-y-3 text-sm text-navy-foreground/70">
              <li className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
                <span>{STORE_INFO.address}</span>
              </li>
              <li className="flex items-start gap-2">
                <Phone className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
                <a href={`tel:${STORE_INFO.phone}`} className="hover:text-gold">{STORE_INFO.phone}</a>
              </li>
              <li className="flex items-start gap-2">
                <Mail className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
                <a href={`mailto:${STORE_INFO.email}`} className="hover:text-gold">{STORE_INFO.email}</a>
              </li>
              <li className="text-xs text-navy-foreground/50">{STORE_INFO.hours}</li>
              <li><Link to="/store-locator" className="text-gold hover:underline">Store locator →</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">Newsletter</h4>
            <p className="mt-4 text-sm text-navy-foreground/70">
              First access to new collections and private events.
            </p>
            <form onSubmit={handleSubscribe} className="mt-4 flex gap-2">
              <Input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="border-navy-foreground/20 bg-navy-foreground/5 text-navy-foreground placeholder:text-navy-foreground/40"
              />
              <Button type="submit" variant="gold" disabled={submitting}>
                Join
              </Button>
            </form>
          </div>
        </div>

        <div className="mt-14 flex flex-col items-center justify-between gap-3 border-t border-navy-foreground/15 pt-6 text-xs text-navy-foreground/50 md:flex-row">
          <p>© {new Date().getFullYear()} Prince Esquare. All rights reserved.</p>
          <div className="flex gap-5">
            <Link to="/about" className="hover:text-gold">About</Link>
            <Link to="/contact" className="hover:text-gold">Contact</Link>
            <Link to="/store-locator" className="hover:text-gold">Find us</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
