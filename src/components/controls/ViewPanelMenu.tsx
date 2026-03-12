/**
 * pow3r.control - View Panel Menu (M3 Compliant)
 *
 * Purpose:
 * - Single icon button that opens panel toggle menu
 * - 48dp touch target, 24dp icon
 * - Menu items: 48dp height, 12dp padding
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
        className={`flex flex-col items-center justify-center gap-1 min-w-[48px] min-h-[48px] p-2 rounded-lg transition-colors touch-manipulation relative ${
          open || activeCount > 0
            ? 'text-[var(--color-cyan)] bg-[var(--color-bg-card)]'
            : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]'
        }`}
        title="Panels"
        aria-label="Panels"
        aria-expanded={open}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <rect x="3" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="3" width="7" height="7" rx="1" />
          <rect x="3" y="14" width="7" height="7" rx="1" />
          <rect x="14" y="14" width="7" height="7" rx="1" />
        </svg>
        <span className="text-[12px] font-mono font-semibold leading-none">Panels</span>
        {activeCount > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-[var(--color-cyan)] text-[9px] font-mono font-bold text-[var(--color-bg-deep)] flex items-center justify-center">
            {activeCount}
          </span>
        )}
      </button>

      {open && (
        <div
          className={`absolute w-[240px] bg-[var(--color-bg-panel)] border border-[var(--color-border)] rounded-lg shadow-xl z-50 overflow-hidden ${
            placement === 'top' ? 'bottom-full left-1/2 -translate-x-1/2 mb-2' : 'left-full top-0 ml-2'
          }`}
        >
          <div className="px-4 py-3 border-b border-[var(--color-border)]">
            <span className="font-mono text-[12px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">
              Panels
            </span>
          </div>
          <div className="max-h-80 overflow-y-auto p-2 space-y-1">
            {panels.map((p) => (
              <button
                key={p.id}
                onClick={() => p.onToggle()}
                className={`w-full flex items-center justify-between min-h-[48px] px-3 py-3 rounded-lg text-left font-mono text-[13px] transition-colors ${
                  p.isActive
                    ? 'bg-[var(--color-cyan)]/10 text-[var(--color-cyan)]'
                    : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-card)]'
                }`}
              >
                <span className="font-semibold">{p.label}</span>
                <div className="flex items-center gap-2">
                  {p.badge !== undefined && p.badge !== '' && (
                    <span className="text-[11px] text-[var(--color-text-muted)] bg-[var(--color-bg-card)] px-1.5 py-0.5 rounded">{String(p.badge)}</span>
                  )}
                  <div className={`w-2 h-2 rounded-full ${p.isActive ? 'bg-[var(--color-cyan)]' : 'bg-[var(--color-border)]'}`} />
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
