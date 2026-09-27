import React from 'react';
import { Link } from 'react-router-dom';

/**
 * Per-page fault boundary — a crash in one route cannot blank the whole app
 * or take down search / contact / cart shells that live outside this tree.
 */
export default class PageErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('[PageErrorBoundary]', this.props.label || 'page', error, info?.componentStack);
  }

  render() {
    if (this.state.error) {
      const label = this.props.label || 'this page';
      return (
        <div className="flex min-h-[60vh] flex-col items-center justify-center bg-navy-950 px-6 py-24 text-center">
          <p className="font-sans text-[10px] font-bold uppercase tracking-[0.35em] text-gold-500">
            Temporarily unavailable
          </p>
          <h1 className="mt-4 max-w-md font-display text-2xl text-white md:text-3xl">
            {label} hit a problem
          </h1>
          <p className="mt-3 max-w-sm font-sans text-sm font-light text-navy-300">
            The rest of the shop — search, cart, and contact — still works. Try again or head home.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => {
                this.setState({ error: null });
                if (typeof this.props.onRetry === 'function') this.props.onRetry();
                else window.location.reload();
              }}
              className="rounded-full bg-gold-600 px-6 py-3 font-sans text-[10px] font-bold uppercase tracking-[0.22em] text-navy-950 hover:bg-gold-500"
            >
              Retry
            </button>
            <Link
              to="/"
              className="border border-gold-500/40 px-6 py-3 font-sans text-[10px] font-bold uppercase tracking-[0.22em] text-gold-400 hover:border-gold-400"
            >
              Home
            </Link>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
