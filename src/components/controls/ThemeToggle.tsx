/**
 * pow3r.control - Theme Toggle
 *
 * Purpose:
 * - Light / Dark / System mode cycle. Icon button.
 * - Pow3r styleguide: transparent bg, border, semantic colors
 * - Touch: min 44px (min-h-[44px] min-w-[44px])
 * - Mobile menu / header placement
 */
import { useThemeStore } from '../../store/theme-store'

const ICONS = {
  light: (
    <path d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} />
  ),
  dark: (
    <path d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} />
  ),
  system: (
    <path d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} />
  ),
}

const LABELS: Record<'light' | 'dark' | 'system', string> = {
  light: 'Light (sunny)',
  dark: 'Dark',
  system: 'System (follow OS)',
}

export function ThemeToggle() {
  const theme = useThemeStore((s) => s.theme)
  const cycleTheme = useThemeStore((s) => s.cycleTheme)

  return (
    <button
      type="button"
      onClick={() => cycleTheme()}
      title={LABELS[theme]}
      aria-label={`Theme: ${LABELS[theme]}. Click to cycle.`}
      className="
        flex items-center justify-center min-h-[44px] min-w-[44px] p-2
        rounded-lg border border-[var(--color-border)] bg-transparent
        text-[var(--color-text-muted)] hover:text-[var(--color-cyan)] hover:border-[var(--color-cyan)]
        active:scale-95 transition-all duration-150
        touch-manipulation
      "
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="shrink-0">
        {ICONS[theme]}
      </svg>
    </button>
  )
}
