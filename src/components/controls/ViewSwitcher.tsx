/**
 * pow3r.control - View Mode Switcher (Pow3r Standard)
 *
 * Purpose:
 * - Bottom navigation bar (portrait) / navigation rail (landscape)
 * - Pow3r specs: 32dp touch targets, 20dp icons, 11px labels below icons
 * - 2D/3D combined as single toggle button
 * - Max 4 visible items in portrait; overflow into "More" menu
 * - Active indicator pill
 */
import { useState, useRef, useEffect } from 'react'
import { useControlStore } from '../../store/control-store'
import type { ViewMode } from '../../lib/types'

interface ViewItem {
  mode: ViewMode
  label: string
  icon: string
}

const PRIMARY_VIEWS: ViewItem[] = [
  { mode: 'dashboard', label: 'Dash', icon: 'M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z' },
  { mode: 'library', label: 'Library', icon: 'M4 6h16M4 10h16M4 14h16M4 18h16' },
]

const OVERFLOW_VIEWS: ViewItem[] = [
  { mode: 'timeline', label: 'Timeline', icon: 'M3 12h18M3 6h18M3 18h18' },
  { mode: 'abacus', label: 'Abacus', icon: 'M12 2a10 10 0 0110 10A10 10 0 0112 22a10 10 0 0110-10A10 10 0 0112 2z' },
  { mode: 'agents', label: 'Agents', icon: 'M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 108 0 4 4 0 00-8 0z' },
  { mode: 'cursor', label: 'Cursor', icon: 'M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122' },
  { mode: 'playground', label: 'Play', icon: 'M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z' },
  { mode: 'pdam', label: 'PDAM', icon: 'M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z' },
  { mode: 'mcp-monitor', label: 'MCP', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
  { mode: 'data', label: 'Data', icon: 'M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4' },
]

const ALL_VIEWS = [...PRIMARY_VIEWS, ...OVERFLOW_VIEWS]

interface ViewSwitcherProps {
  orientation?: 'horizontal' | 'vertical'
}

function NavButton({ item, isActive, onClick }: { item: ViewItem; isActive: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center justify-center gap-0.5 min-w-[32px] min-h-[32px] px-2 py-1.5 rounded-md transition-colors relative touch-manipulation ${
        isActive
          ? 'text-[var(--color-cyan)]'
          : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]'
      }`}
      title={item.label}
      aria-label={item.label}
    >
      {isActive && (
        <div className="absolute inset-x-1 top-0.5 h-[24px] rounded-full bg-[var(--color-cyan)]/10" />
      )}
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="relative z-10 shrink-0">
        <path d={item.icon} />
      </svg>
      <span className="text-[11px] font-mono font-medium leading-none relative z-10">{item.label}</span>
    </button>
  )
}

function ViewToggle2D3D() {
  const viewMode = useControlStore((s) => s.viewMode)
  const setViewMode = useControlStore((s) => s.setViewMode)
  const is3D = viewMode === '3d'
  const isActive = viewMode === '2d' || viewMode === '3d'

  const toggle = () => {
    if (viewMode === '2d') setViewMode('3d')
    else if (viewMode === '3d') setViewMode('2d')
    else setViewMode('2d')
  }

  return (
    <button
      onClick={toggle}
      className={`flex flex-col items-center justify-center gap-0.5 min-w-[32px] min-h-[32px] px-2 py-1.5 rounded-md transition-colors relative touch-manipulation ${
        isActive
          ? 'text-[var(--color-cyan)]'
          : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]'
      }`}
      title={is3D ? 'Switch to 2D' : 'Switch to 3D'}
      aria-label={is3D ? '3D view active, click for 2D' : '2D view active, click for 3D'}
    >
      {isActive && (
        <div className="absolute inset-x-1 top-0.5 h-[24px] rounded-full bg-[var(--color-cyan)]/10" />
      )}
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="relative z-10 shrink-0">
        {is3D ? (
          <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
        ) : (
          <path d="M4 4h16v16H4z" />
        )}
      </svg>
      <span className="text-[11px] font-mono font-medium leading-none relative z-10">{is3D ? '3D' : '2D'}</span>
    </button>
  )
}

export function ViewSwitcher({ orientation = 'horizontal' }: ViewSwitcherProps) {
  const viewMode = useControlStore((s) => s.viewMode)
  const setViewMode = useControlStore((s) => s.setViewMode)
  const isVertical = orientation === 'vertical'

  const [moreOpen, setMoreOpen] = useState(false)
  const moreRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!moreOpen) return
    const close = (e: MouseEvent) => {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) setMoreOpen(false)
    }
    document.addEventListener('click', close)
    return () => document.removeEventListener('click', close)
  }, [moreOpen])

  const isOverflowActive = OVERFLOW_VIEWS.some((v) => v.mode === viewMode)

  if (isVertical) {
    return (
      <nav className="flex flex-col items-center gap-0.5 w-full overflow-y-auto py-1">
        <ViewToggle2D3D />
        {ALL_VIEWS.map((item) => (
          <NavButton
            key={item.mode}
            item={item}
            isActive={viewMode === item.mode}
            onClick={() => setViewMode(item.mode)}
          />
        ))}
      </nav>
    )
  }

  return (
    <nav className="flex items-center justify-around flex-1 gap-0.5">
      {/* 2D/3D toggle button */}
      <ViewToggle2D3D />

      {/* Primary views */}
      {PRIMARY_VIEWS.map((item) => (
        <NavButton
          key={item.mode}
          item={item}
          isActive={viewMode === item.mode}
          onClick={() => setViewMode(item.mode)}
        />
      ))}

      {/* More overflow button */}
      <div ref={moreRef} className="relative">
        <button
          onClick={() => setMoreOpen((o) => !o)}
          className={`flex flex-col items-center justify-center gap-0.5 min-w-[32px] min-h-[32px] px-2 py-1.5 rounded-md transition-colors touch-manipulation ${
            moreOpen || isOverflowActive
              ? 'text-[var(--color-cyan)]'
              : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]'
          }`}
          title="More views"
          aria-label="More views"
          aria-expanded={moreOpen}
        >
          {isOverflowActive && (
            <div className="absolute inset-x-1 top-0.5 h-[24px] rounded-full bg-[var(--color-cyan)]/10" />
          )}
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="relative z-10">
            <circle cx="12" cy="5" r="1.5" fill="currentColor" />
            <circle cx="12" cy="12" r="1.5" fill="currentColor" />
            <circle cx="12" cy="19" r="1.5" fill="currentColor" />
          </svg>
          <span className="text-[11px] font-mono font-medium leading-none relative z-10">More</span>
        </button>

        {moreOpen && (
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-[180px] bg-[var(--color-bg-panel)] border border-[var(--color-border)] rounded-lg shadow-xl z-50 overflow-hidden">
            <div className="p-2 space-y-0.5">
              {OVERFLOW_VIEWS.map((item) => (
                <button
                  key={item.mode}
                  onClick={() => {
                    setViewMode(item.mode)
                    setMoreOpen(false)
                  }}
                  className={`w-full flex items-center gap-2 min-h-[32px] px-2 py-1.5 rounded-md text-left transition-colors ${
                    viewMode === item.mode
                      ? 'bg-[var(--color-cyan)]/10 text-[var(--color-cyan)]'
                      : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-card)]'
                  }`}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="shrink-0">
                    <path d={item.icon} />
                  </svg>
                  <span className="text-[12px] font-mono font-medium">{item.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
