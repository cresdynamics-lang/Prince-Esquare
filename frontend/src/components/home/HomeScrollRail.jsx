import { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * Shared horizontal rail — momentum scroll on mobile, arrow controls on desktop.
 */
export default function HomeScrollRail({
  children,
  className = '',
  gapClass = 'gap-4 md:gap-5',
  ariaLabel = 'Scrollable row',
}) {
  const scrollerRef = useRef(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);

  const updateEdges = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setAtStart(scrollLeft <= 4);
    setAtEnd(scrollLeft + clientWidth >= scrollWidth - 4);
  }, []);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return undefined;
    updateEdges();
    el.addEventListener('scroll', updateEdges, { passive: true });
    window.addEventListener('resize', updateEdges);
    return () => {
      el.removeEventListener('scroll', updateEdges);
      window.removeEventListener('resize', updateEdges);
    };
  }, [updateEdges, children]);

  const scrollByCards = (dir) => {
    const el = scrollerRef.current;
    if (!el) return;
    const amount = Math.max(el.clientWidth * 0.72, 240);
    el.scrollBy({ left: dir * amount, behavior: 'smooth' });
  };

  return (
    <div className={`relative ${className}`}>
      <button
        type="button"
        aria-label="Scroll left"
        onClick={() => scrollByCards(-1)}
        disabled={atStart}
        className={`absolute left-0 top-1/2 z-20 hidden h-11 w-11 -translate-y-1/2 items-center justify-center border border-gold-500/25 bg-navy-950/90 text-gold-400 backdrop-blur-sm transition-opacity md:flex ${
          atStart ? 'pointer-events-none opacity-0' : 'opacity-100 hover:border-gold-500/50 hover:text-gold-200'
        }`}
      >
        <ChevronLeft size={18} />
      </button>
      <button
        type="button"
        aria-label="Scroll right"
        onClick={() => scrollByCards(1)}
        disabled={atEnd}
        className={`absolute right-0 top-1/2 z-20 hidden h-11 w-11 -translate-y-1/2 items-center justify-center border border-gold-500/25 bg-navy-950/90 text-gold-400 backdrop-blur-sm transition-opacity md:flex ${
          atEnd ? 'pointer-events-none opacity-0' : 'opacity-100 hover:border-gold-500/50 hover:text-gold-200'
        }`}
      >
        <ChevronRight size={18} />
      </button>

      <div
        ref={scrollerRef}
        role="region"
        aria-label={ariaLabel}
        className={`flex touch-pan-x overflow-x-auto scroll-smooth pb-2 ${gapClass} [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden`}
      >
        {children}
      </div>
    </div>
  );
}
