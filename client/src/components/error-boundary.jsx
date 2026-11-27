import { Component } from "react";
import { RefreshCw } from "lucide-react";

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, errorMessage: "" };
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      errorMessage: error?.message || "An unexpected error occurred.",
    };
  }

  componentDidCatch(error, info) {
    console.error("Application error boundary caught:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen w-full bg-[var(--color-base-bg)] text-[var(--color-base-text)] flex flex-col items-center justify-center p-6 text-center">
          <div className="max-w-md w-full rounded-3xl border border-[var(--color-base-border)] bg-[var(--color-base-surface)] p-8 space-y-4 shadow-xl">
            <p className="font-cursive text-5xl aurora-text leading-[0.8]">
              Paused
            </p>
            <h1 className="font-display text-2xl font-bold tracking-tight">
              Something went wrong
            </h1>
            <p className="text-xs text-[var(--color-base-muted)] leading-relaxed">
              {this.state.errorMessage}
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-2 inline-flex items-center gap-2 px-6 py-2.5 rounded-full aurora-bg text-white text-xs font-semibold cursor-pointer hover:opacity-95 transition-opacity"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reload Page</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
