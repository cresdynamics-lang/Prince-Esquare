import { createFileRoute } from "@tanstack/react-router";
import { MapPin, Phone, Clock } from "lucide-react";
import { STORE_INFO } from "@/lib/format";

export const Route = createFileRoute("/store-locator")({
  head: () => ({ meta: [{ title: "Store Locator — Prince Esquare Nairobi" }] }),
  component: StoreLocatorPage,
});

function StoreLocatorPage() {
  return (
    <div className="container mx-auto px-4 py-16">
      <div className="mb-10 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gold">Visit Us</p>
        <h1 className="mt-3 font-display text-4xl font-bold md:text-5xl">Find our store</h1>
      </div>
      <div className="grid gap-8 lg:grid-cols-[1fr_2fr]">
        <div className="rounded-md border border-border bg-card p-6">
          <h2 className="font-display text-2xl font-bold">Nairobi Flagship</h2>
          <ul className="mt-5 space-y-3 text-sm">
            <li className="flex items-start gap-3"><MapPin className="mt-0.5 h-5 w-5 text-gold" /><span>{STORE_INFO.address}</span></li>
            <li className="flex items-start gap-3"><Phone className="mt-0.5 h-5 w-5 text-gold" /><a href={`tel:${STORE_INFO.phone}`}>{STORE_INFO.phone}</a></li>
            <li className="flex items-start gap-3"><Clock className="mt-0.5 h-5 w-5 text-gold" /><span>{STORE_INFO.hours}</span></li>
          </ul>
        </div>
        <div className="aspect-video overflow-hidden rounded-md border border-border">
          <iframe
            src={STORE_INFO.mapEmbed}
            width="100%"
            height="100%"
            style={{ border: 0 }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title="Prince Esquare store location"
          />
        </div>
      </div>
    </div>
  );
}
