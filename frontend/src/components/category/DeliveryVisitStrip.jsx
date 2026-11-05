import { MapPin, RotateCcw, Truck, Zap } from 'lucide-react';

export const STORE_MAP_URL =
  'https://www.google.com/maps/search/?api=1&query=Prince+Esquire+Yala+Towers+Nairobi';

const ITEM = 'flex items-center gap-2.5 font-sans text-xs leading-snug text-navy-100 sm:text-[13px]';

/** The reasons to buy here rather than from a marketplace: speed, returns and a real shop. */
export default function DeliveryVisitStrip() {
  return (
    <section aria-label="Delivery and returns" className="border-y border-gold-500/15 bg-navy-900/40">
      <div className="container mx-auto grid grid-cols-2 gap-x-4 gap-y-3 px-5 py-4 sm:px-6 lg:grid-cols-4">
        <p className={ITEM}>
          <Zap size={17} className="shrink-0 text-gold-400" aria-hidden />
          Same day in Nairobi, in 1-2 hours
        </p>
        <p className={ITEM}>
          <Truck size={17} className="shrink-0 text-gold-400" aria-hidden />
          Countrywide in 1-2 days
        </p>
        <p className={ITEM}>
          <RotateCcw size={17} className="shrink-0 text-gold-400" aria-hidden />
          Returns within 5 days
        </p>
        <a
          href={STORE_MAP_URL}
          target="_blank"
          rel="noopener noreferrer"
          className={`${ITEM} underline decoration-gold-500/40 underline-offset-4 transition-colors hover:text-gold-300`}
        >
          <MapPin size={17} className="shrink-0 text-gold-400" aria-hidden />
          Yala Towers: get directions
        </a>
      </div>
    </section>
  );
}
