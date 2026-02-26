/**
 * pow3r.control - View Mode Switcher
 *
 * Purpose:
 * - Toggle between 2D, 3D, Timeline, and Dashboard view modes
 * - Bottom navigation bar with icons and labels
 */
import { useControlStore } from '../../store/control-store'
import type { ViewMode } from '../../lib/types'

const VIEW_MODES: Array<{ mode: ViewMode; label: string; icon: string }> = [
  { mode: '2d', label: '2D', icon: 'M4 4h16v16H4z' },
  { mode: '3d', label: '3D', icon: 'M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5' },
  { mode: 'timeline', label: 'Timeline', icon: 'M3 12h18M3 6h18M3 18h18' },
  { mode: 'dashboard', label: 'Dash', icon: 'M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z' },
]

export function ViewSwitcher() {
  const viewMode = useControlStore((s) => s.viewMode)
  const setViewMode = useControlStore((s) => s.setViewMode)

  return (
    <nav className="flex items-center gap-1 bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-lg p-1">
      {VIEW_MODES.map(({ mode, label, icon }) => {
        const isActive = viewMode === mode
        return (
          <button
            key={mode}
            onClick={() => setViewMode(mode)}
            className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-md transition-colors ${
              isActive
                ? 'bg-[var(--color-bg-panel)] text-[var(--color-cyan)]'
                : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]'
            }`}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d={icon} />
            </svg>
            <span className="text-[9px] font-mono font-semibold">{label}</span>
          </button>
        )
      })}
    </nav>
  )
}
