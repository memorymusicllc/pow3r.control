/**
 * OSCViewLayout - OSC iPad-style layout for Control views
 *
 * Glassmorphism panel, tab strip, content area. Mobile-first:
 * bottom nav on mobile, left sidebar on desktop. Touch targets min 44px.
 */
import { useState, useEffect } from 'react'

export interface OSCViewTab {
  value: string
  label: string
}

interface OSCViewLayoutProps {
  tabs?: OSCViewTab[]
  activeTab?: string
  onTabChange?: (value: string) => void
  children: React.ReactNode
  title?: string
  headerRight?: React.ReactNode
  /** When set, shows [x] to hide panel (in addition to [-] collapse) */
  onClose?: () => void
  className?: string
}

export function OSCViewLayout({
  tabs = [],
  activeTab = '',
  onTabChange = () => {},
  children,
  title = 'Control',
  headerRight,
  onClose,
  className = '',
}: OSCViewLayoutProps) {
  const hasTabs = tabs.length > 0
  const [isNarrow, setIsNarrow] = useState(typeof window !== 'undefined' ? window.innerWidth < 768 : false)
  const [navVisible, setNavVisible] = useState(true)
  const [lastScrollY, setLastScrollY] = useState(0)

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)')
    const handler = () => setIsNarrow(mq.matches)
    mq.addEventListener('change', handler)
    handler()
    return () => mq.removeEventListener('change', handler)
  }, [])

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY
      setNavVisible(y <= lastScrollY || y < 10)
      setLastScrollY(y)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [lastScrollY])

  const navClass = [
    'flex gap-1 bg-[var(--color-bg-panel)]/95 backdrop-blur-md border-[var(--color-border)]',
    isNarrow ? 'fixed bottom-0 left-0 right-0 z-50 border-t p-2' : 'border-r w-48 min-h-full p-4 flex-col',
    !navVisible && isNarrow ? 'translate-y-full transition-transform duration-300' : '',
  ].filter(Boolean).join(' ')

  return (
    <div className={`min-h-full bg-[var(--color-bg-deep)] text-[var(--color-text-primary)] ${className}`}>
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-bg-surface)]/95 px-5 py-3">
        <h1 className="text-lg font-semibold text-[var(--color-text-primary)]">{title}</h1>
        <div className="flex items-center gap-2">
          {headerRight}
          {onClose && (
            <button
              onClick={onClose}
              className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] font-mono text-sm min-w-[32px] min-h-[32px] flex items-center justify-center rounded hover:bg-[var(--color-bg-card)]"
              title="Hide panel"
            >
              x
            </button>
          )}
        </div>
      </div>

      <div className={`flex ${hasTabs && (isNarrow ? 'flex-col pb-20' : 'flex-row')}`}>
        {hasTabs && (
        <nav className={navClass}>
          {tabs.map((t) => (
            <button
              key={t.value}
              onClick={() => onTabChange(t.value)}
              className={`min-h-[44px] px-4 py-2 text-[10px] uppercase tracking-widest font-bold rounded transition-colors border ${
                activeTab === t.value
                  ? 'bg-[var(--color-bg-card)] text-[var(--color-cyan)] border-[var(--color-cyan)]/50'
                  : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-card)]/50 border-transparent'
              }`}
            >
              {t.label}
            </button>
          ))}
        </nav>
        )}

        <main className="flex-1 px-5 py-4 overflow-auto">
          <div className="max-w-[520px] lg:max-w-none mx-auto">{children}</div>
        </main>
      </div>
    </div>
  )
}
