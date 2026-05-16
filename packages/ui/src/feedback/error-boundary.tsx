import { Component, type ErrorInfo, type ReactNode } from 'react'

export interface ErrorBoundaryProps {
  children: ReactNode
  /** Optional fallback renderer. Receives the captured error + reset handle. */
  fallback?: (error: Error, reset: () => void) => ReactNode
  /** Side-channel for telemetry (Sentry, console, custom logger). */
  onError?: (error: Error, info: ErrorInfo) => void
}

interface State {
  error: Error | null
}

const DEFAULT_FALLBACK = (error: Error, reset: () => void): ReactNode => (
  <div
    role="alert"
    className="m-4 flex flex-col gap-3 rounded-2xl border border-rose-500/30 bg-rose-500/[0.04] p-6 text-sm"
  >
    <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-rose-700">
      BEKLENMEDIK HATA
    </div>
    <div className="font-serif text-xl font-light">
      Bir şeyler <em className="italic font-light text-muted-foreground">ters gitti.</em>
    </div>
    <p className="text-muted-foreground">
      Sayfa bileşeni render edilirken bir hata yakaladık. Yeniden denemek için aşağıdaki
      düğmeyi kullanın; hata teknik ekibe iletildi.
    </p>
    <details className="rounded-lg border border-border bg-card p-3 text-xs">
      <summary className="cursor-pointer font-mono text-[11px] text-muted-foreground">
        Teknik ayrıntı
      </summary>
      <pre className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap text-[11px] text-muted-foreground">
        {error.message}
      </pre>
    </details>
    <button
      type="button"
      onClick={reset}
      className="self-start rounded-xl border border-border bg-card px-4 py-1.5 text-sm font-medium transition hover:bg-foreground/5"
    >
      Yeniden dene
    </button>
  </div>
)

/**
 * Class-based ErrorBoundary — React's official `componentDidCatch` hook is
 * still class-only. Wrap your route shell with it; pass `onError` to forward
 * exceptions into Sentry / your logger.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    try {
      this.props.onError?.(error, info)
    } catch {
      /* never let telemetry errors mask the original failure */
    }
  }

  private reset = () => {
    this.setState({ error: null })
  }

  render() {
    if (this.state.error) {
      const fallback = this.props.fallback ?? DEFAULT_FALLBACK
      return fallback(this.state.error, this.reset)
    }
    return this.props.children
  }
}

export default ErrorBoundary
