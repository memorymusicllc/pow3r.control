/**
 * pow3r.control - Theme Store
 *
 * Purpose:
 * - Light / Dark / System mode theme switching
 * - Persists to localStorage
 * - Applies data-theme to document.documentElement
 *
 * Pow3r Styleguide: transparent backgrounds, borders, semantic colors
 * Touch: min 44px targets per mobile layout rules
 */
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type ThemeMode = 'light' | 'dark' | 'system'

const STORAGE_KEY = 'pow3r-control-theme'

export function getResolvedTheme(mode: ThemeMode): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'dark'
  if (mode === 'system') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }
  return mode
}

export function applyTheme(resolved: 'light' | 'dark') {
  document.documentElement.setAttribute('data-theme', resolved)
}

interface ThemeState {
  theme: ThemeMode
  setTheme: (theme: ThemeMode) => void
  cycleTheme: () => ThemeMode
  resolved: 'light' | 'dark'
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: 'dark',
      resolved: 'dark',

      setTheme: (theme) => {
        const resolved = getResolvedTheme(theme)
        applyTheme(resolved)
        set({ theme, resolved })
      },

      cycleTheme: () => {
        const next: Record<ThemeMode, ThemeMode> = {
          light: 'dark',
          dark: 'system',
          system: 'light',
        }
        const theme = next[get().theme]
        const resolved = getResolvedTheme(theme)
        applyTheme(resolved)
        set({ theme, resolved })
        return theme
      },
    }),
    {
      name: STORAGE_KEY,
      partialize: (s) => ({ theme: s.theme }),
    }
  )
)

/** Initialize theme before first paint. Call from main.tsx. */
export function initTheme() {
  if (typeof window === 'undefined') return
  const raw = localStorage.getItem(STORAGE_KEY)
  let theme: ThemeMode = 'dark'
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as { state?: { theme?: ThemeMode } }
      theme = (parsed?.state?.theme as ThemeMode) ?? 'dark'
    } catch {
      theme = 'dark'
    }
  }
  const resolved = getResolvedTheme(theme)
  applyTheme(resolved)
}
