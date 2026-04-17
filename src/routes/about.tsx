import { createFileRoute } from "@tanstack/react-router";
import { Sparkles, ShieldCheck, Store } from "lucide-react";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About Prince Esquare — Premium Menswear in Nairobi" },
      { name: "description", content: "The story of Prince Esquare — premium menswear crafted for the modern Nairobi gentleman." },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <div>
      <section className="relative bg-navy py-20 text-center text-navy-foreground md:py-28">
        <div className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-30" style={{ backgroundImage: "url('/hero-suit.jpg')" }} />
        <div className="relative z-10">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gold">Our Story</p>
          <h1 className="mt-3 font-display text-4xl font-bold md:text-6xl">Crafting the modern gentleman.</h1>
          <p className="mx-auto mt-5 max-w-2xl px-4 text-base text-navy-foreground/70">
            Prince Esquare was founded on a simple belief: every man deserves clothes that fit him —
            and his ambitions — perfectly.
          </p>
        </div>
      </section>

      <section className="container mx-auto grid max-w-5xl gap-12 px-4 py-16 md:grid-cols-3">
        {[
          { icon: Sparkles, t: "Considered Craft", b: "Half-canvas suits, Egyptian cotton shirts, Goodyear-welted shoes — built to last." },
          { icon: Store, t: "Rooted in Nairobi", b: "From our Kimathi Street store to your wardrobe — proudly Kenyan, internationally inspired." },
          { icon: ShieldCheck, t: "Honest Promise", b: "Transparent pricing, easy returns, and a fit guarantee on every piece." },
        ].map((b) => (
          <div key={b.t} className="text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-gold/40 bg-gold/10 text-gold">
              <b.icon className="h-6 w-6" />
            </div>
            <h3 className="mt-4 font-display text-xl font-semibold">{b.t}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{b.b}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
