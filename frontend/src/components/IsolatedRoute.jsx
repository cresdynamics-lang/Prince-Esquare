import { Suspense } from 'react';
import PageErrorBoundary from './PageErrorBoundary';

function RouteFallback() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center bg-navy-950">
      <p className="font-sans text-[10px] uppercase tracking-[0.3em] text-gold-500/50">Loading…</p>
    </div>
  );
}

/**
 * Isolates a route: own error boundary + Suspense so lazy chunk failures
 * cannot cascade into neighbouring pages or global shells (analytics, nav).
 */
export default function IsolatedRoute({ children, label }) {
  return (
    <PageErrorBoundary label={label}>
      <Suspense fallback={<RouteFallback />}>{children}</Suspense>
    </PageErrorBoundary>
  );
}
