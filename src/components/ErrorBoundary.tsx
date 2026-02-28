/**
 * ErrorBoundary - Catches React errors and shows fallback UI
 * Prevents full app crash from Live features and WF Library Run
 */
import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.props.onError?.(error, errorInfo)
    console.error('[ErrorBoundary]', error, errorInfo)
  }

  render() {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) return this.props.fallback
      return (
        <div className="p-4 rounded border border-[var(--color-error)] bg-[var(--color-error)]10">
          <p className="font-mono text-sm text-[var(--color-error)]">Something went wrong.</p>
          <p className="font-mono text-[10px] text-[var(--color-text-muted)] mt-2">{this.state.error.message}</p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="mt-3 font-mono text-[10px] px-2 py-1 rounded bg-[var(--color-bg-card)] hover:bg-[var(--color-cyan)]20"
          >
            Dismiss
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
