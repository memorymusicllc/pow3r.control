/**
 * pow3r.control - OSCViewLayout Review Toggle
 *
 * Purpose:
 * - Enables review mode: visible grid/bounds, contrast-safe outlines, debug labels
 * - Persists to localStorage via control-store
 * - Touch: min 44px
 */
import { useControlStore } from '../../store/control-store'

export function ReviewToggle() {
  const isReviewMode = useControlStore((s) => s.isReviewMode)
  const toggleReviewMode = useControlStore((s) => s.toggleReviewMode)

  return (
    <button
      type="button"
      onClick={() => toggleReviewMode()}
      title={isReviewMode ? 'Review mode: on (grid, outlines, labels)' : 'Review mode: off'}
      aria-label={`Review mode: ${isReviewMode ? 'on' : 'off'}. Click to toggle.`}
      className={`
        flex items-center justify-center min-h-[44px] min-w-[44px] p-2
        rounded-lg border transition-all duration-150
        touch-manipulation
        ${isReviewMode
          ? 'border-[var(--color-cyan)] text-[var(--color-cyan)] bg-[var(--color-cyan)]/10'
          : 'border-[var(--color-border)] bg-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] hover:border-[var(--color-border)]'
        }
        active:scale-95
      `}
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="shrink-0">
        <path d="M9 17H7A2 2 0 015 15V5a2 2 0 012-2h10a2 2 0 012 2v10a2 2 0 01-2 2h-2M9 17l2 0M9 17v-4m0 0l2-2 2 2m-2-2v4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  )
}
