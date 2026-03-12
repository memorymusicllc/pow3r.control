/**
 * pow3r.control - View Panel Menu
 *
 * Purpose:
 * - Single [view_icon_btn] that opens a select menu listing all panels
 * - Consolidates WF, Legend, X-Files, Gov, X-Log, Gates, Config, Mix, Canvas instructions
 * - Min 32px touch target, 8px spacing per user design rules
 */
import { useState, useRef, useEffect } from 'react'

export interface PanelItem {
  id: string
  label: string
  isActive: boolean
  onToggle: () => void
  badge?: string | number
}

interface ViewPanelMenuProps {
  panels: PanelItem[]
  className?: string
  /** 'top' = menu opens upward (footer nav), 'right' = menu opens right (sidebar nav) */
  placement?: 'top' | 'right'
}

export function ViewPanelMenu({ panels, className = '', placement = 'top' }: ViewPanelMenuProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    if (open) document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [open])

  const activeCount = panels.filter((p) => p.isActive).length

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        onClick={() => setOpen((o) => !o)}
        className={`flex items-center justify-center min-w-[32px] min-h-[32px] p-2 rounded transition-colors ${
          open || activeCount > 0
            ? 'text-[var(--color-cyan)] bg-[var(--color-bg-card)]'
            : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]'
        }`}
        title="View panels"
        aria-label="View panels"
        aria-expanded={open}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="3" width="7" height="7" rx="1" />
          <rect x="3" y="14" width="7" height="7" rx="1" />
          <rect x="14" y="14" width="7" height="7" rx="1" />
        </svg>
        {activeCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-[var(--color-cyan)] text-[8px] font-mono font-bold text-[var(--color-bg-deep)] flex items-center justify-center">
            {activeCount}
          </span>
        )}
      </button>

      {open && (
        <div
          className={`absolute w-56 bg-[var(--color-bg-panel)] border border-[var(--color-border)] rounded-lg shadow-xl z-50 overflow-hidden ${
            placement === 'top' ? 'bottom-full left-0 mb-2' : 'left-full top-0 ml-2'
          }`}
        >
          <div className="p-2 border-b border-[var(--color-border)]">
            <span className="font-mono text-[10px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">
              Panels
            </span>
          </div>
          <div className="max-h-72 overflow-y-auto p-2 space-y-1">
            {panels.map((p) => (
              <button
                key={p.id}
                onClick={() => {
                  p.onToggle()
                }}
                className={`w-full flex items-center justify-between min-h-[32px] px-3 py-2 rounded text-left font-mono text-[10px] transition-colors ${
                  p.isActive
                    ? 'bg-[var(--color-bg-card)] text-[var(--color-cyan)]'
                    : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-card)]'
                }`}
              >
                <span>{p.label}</span>
                {p.badge !== undefined && p.badge !== '' && (
                  <span className="text-[9px] text-[var(--color-text-muted)]">{p.badge}</span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
