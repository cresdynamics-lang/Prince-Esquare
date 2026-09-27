import React from 'react';

/** Catches lazy-load / render failures so admin does not go blank (navy “blue screen”). */
export default class AdminSectionErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('[AdminSectionErrorBoundary]', error, info?.componentStack);
  }

  render() {
    if (this.state.error) {
      const label = this.props.label || 'this section';
      return (
        <div className="flex flex-col items-center justify-center min-h-[16rem] px-6 text-center space-y-4">
          <p className="text-red-400 text-sm font-medium">
            Something went wrong loading {label}.
          </p>
          <p className="text-gold-500/50 text-xs max-w-md">
            {String(this.state.error?.message || this.state.error)}
          </p>
          <button
            type="button"
            onClick={() => {
              this.setState({ error: null });
              if (typeof this.props.onRetry === 'function') this.props.onRetry();
              else window.location.reload();
            }}
            className="px-4 py-2 text-[10px] font-bold uppercase tracking-widest bg-gold-600 text-navy-950 rounded-full hover:bg-gold-500"
          >
            Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
