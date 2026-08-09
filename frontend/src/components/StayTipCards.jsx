import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, Menu } from 'lucide-react';

const DEFAULT_DURATION_MS = 4500;

function TipCard({ tip, onDone }) {
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  useEffect(() => {
    const t = window.setTimeout(() => onDoneRef.current(), tip.durationMs ?? DEFAULT_DURATION_MS);
    return () => window.clearTimeout(t);
  }, [tip]);

  useEffect(() => {
    if (tip.pointTo !== 'menu') return undefined;
    window.dispatchEvent(new CustomEvent('prince:highlight-menu', { detail: { on: true } }));
    return () => window.dispatchEvent(new CustomEvent('prince:highlight-menu', { detail: { on: false } }));
  }, [tip.pointTo]);

  const fromTop = tip.position === 'top';
  const cta = tip.cta;

  const handleCta = () => {
    if (cta?.action === 'menu') {
      window.dispatchEvent(new CustomEvent('prince:open-menu'));
    }
    onDone();
  };

  return (
    <motion.div
      role="status"
      aria-live="polite"
      initial={{ opacity: 0, y: fromTop ? -28 : 36, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: fromTop ? -16 : 24, scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 380, damping: 28 }}
      className={`pointer-events-auto max-w-[min(92vw,20rem)] rounded-2xl border border-white/20 bg-white/[0.10] backdrop-blur-md shadow-[0_12px_40px_rgba(0,0,0,0.35)] px-4 py-3.5 ${
        tip.pointTo === 'menu' ? 'ring-1 ring-gold-500/40' : ''
      }`}
    >
      <div className="space-y-1.5">
        {(tip.lines || []).slice(0, 2).map((line) => (
          <p key={line} className="text-[13px] leading-snug text-white/95 font-medium tracking-wide">
            {line}
          </p>
        ))}
      </div>

      {cta ? (
        cta.to ? (
          <Link
            to={cta.to}
            onClick={onDone}
            className="mt-3 inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.22em] text-gold-400 hover:text-gold-300"
          >
            {cta.label}
            <ArrowRight size={12} />
          </Link>
        ) : (
          <button
            type="button"
            onClick={handleCta}
            className="mt-3 inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.22em] text-gold-400 hover:text-gold-300"
          >
            {cta.action === 'menu' ? <Menu size={12} /> : null}
            {cta.label}
            <ArrowRight size={12} />
          </button>
        )
      ) : null}
    </motion.div>
  );
}

/**
 * Queued auto-dismiss tip cards (max ~2 lines / 10 words each tip).
 * position: 'top' | 'bottom'
 */
export default function StayTipQueue({ tips = [], enabled = true }) {
  const [active, setActive] = useState(null);
  const timersRef = useRef([]);
  const indexRef = useRef(0);

  useEffect(() => {
    timersRef.current.forEach((id) => window.clearTimeout(id));
    timersRef.current = [];
    indexRef.current = 0;
    setActive(null);

    if (!enabled || !tips.length) return undefined;

    const schedule = (fn, ms) => {
      const id = window.setTimeout(fn, ms);
      timersRef.current.push(id);
      return id;
    };

    const showAt = (i) => {
      if (i >= tips.length) {
        setActive(null);
        return;
      }
      indexRef.current = i;
      setActive(tips[i]);
    };

    schedule(() => showAt(0), tips[0]?.delayMs ?? 0);

    return () => {
      timersRef.current.forEach((id) => window.clearTimeout(id));
      timersRef.current = [];
      window.dispatchEvent(new CustomEvent('prince:highlight-menu', { detail: { on: false } }));
    };
  }, [tips, enabled]);

  const dismiss = () => {
    setActive(null);
    const next = indexRef.current + 1;
    if (next >= tips.length) return;
    const gap = tips[next]?.gapMs ?? 1200;
    const id = window.setTimeout(() => {
      indexRef.current = next;
      setActive(tips[next]);
    }, gap);
    timersRef.current.push(id);
  };

  const fromTop = active?.position === 'top';

  return (
    <div
      className={`pointer-events-none fixed inset-x-0 z-[70] flex justify-center px-4 ${
        fromTop ? 'top-[5.5rem] md:top-24' : 'bottom-6 md:bottom-8'
      }`}
      aria-hidden={!active}
    >
      <AnimatePresence mode="wait">
        {active ? <TipCard key={active.id} tip={active} onDone={dismiss} /> : null}
      </AnimatePresence>
    </div>
  );
}

/** Sale-page tip sequence for Meta / storefront landings */
export const SALE_STAY_TIPS = [
  {
    id: 'welcome-scroll',
    position: 'top',
    delayMs: 900,
    durationMs: 4800,
    lines: ['Karibu, Nairobi style.', 'Scroll down for your pick.'],
  },
  {
    id: 'size-scroll',
    position: 'bottom',
    delayMs: 0,
    gapMs: 1600,
    durationMs: 4200,
    lines: ['Looking for a size?', 'Keep scrolling the grid.'],
  },
  {
    id: 'menu-polos',
    position: 'bottom',
    delayMs: 0,
    gapMs: 1800,
    durationMs: 5000,
    pointTo: 'menu',
    lines: ['Tap the menu here.', 'New polos waiting for you.'],
    cta: { label: 'Open menu', action: 'menu' },
  },
  {
    id: 'khaki-trend',
    position: 'bottom',
    delayMs: 0,
    gapMs: 1800,
    durationMs: 4800,
    pointTo: 'menu',
    lines: ['Trending khaki trousers.', 'Find them in the menu.'],
    cta: { label: 'Shop khaki', to: '/products?category=khaki' },
  },
  {
    id: 'two-khakis',
    position: 'bottom',
    delayMs: 0,
    gapMs: 2000,
    durationMs: 5000,
    lines: ['Buy two khakis today.', 'They last you four years.'],
    cta: { label: 'See khaki', to: '/products?category=khaki' },
  },
];

/** Product page — after 1 minute on the same product */
export const PRODUCT_DWELL_TIPS = [
  {
    id: 'restock-two-weeks',
    position: 'bottom',
    delayMs: 60_000,
    durationMs: 5500,
    lines: ['Size not here?', 'Check back in two weeks.'],
    cta: { label: 'Browse sale', to: '/sale' },
  },
];
