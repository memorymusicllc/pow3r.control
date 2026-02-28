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
  { mode: 'library', label: 'Library', icon: 'M4 6h16M4 10h16M4 14h16M4 18h16' },
  { mode: 'abacus', label: 'Abacus', icon: 'M12 2a10 10 0 0110 10A10 10 0 0112 22a10 10 0 0110-10A10 10 0 0112 2z' },
  { mode: 'agents', label: 'Agents', icon: 'M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 108 0 4 4 0 00-8 0z' },
  { mode: 'cursor', label: 'Cursor', icon: 'M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122' },
  { mode: 'playground', label: 'Playground', icon: 'M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z' },
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
