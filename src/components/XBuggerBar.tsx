/**
 * pow3r.control - XBugger Global Loading Progress Bar
 *
 * Purpose:
 * - Full-width progress bar at top of page
 * - Shows loading progress for config, views, etc.
 */
import { useXBuggerStore } from '../store/xbugger-store'

export function XBuggerBar() {
  const progress = useXBuggerStore((s) => s.progress)
  const label = useXBuggerStore((s) => s.label)
  const active = useXBuggerStore((s) => s.active)

  if (!active) return null

  return (
    <div
      className="w-full shrink-0 z-[100] relative"
      role="progressbar"
      aria-valuenow={progress}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label ?? 'Loading'}
      title={label ?? undefined}
    >
      <div className="h-1 bg-[var(--color-bg-deep)]">
        <div
          className="h-full bg-[var(--color-cyan)] transition-all duration-300 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
      {label && (
        <div className="px-3 py-0.5 text-[9px] font-mono text-[var(--color-text-muted)] truncate bg-[var(--color-bg-surface)]/80">
          {label}
        </div>
      )}
    </div>
  )
}
