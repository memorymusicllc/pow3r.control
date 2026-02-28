/**
 * pow3r.control - Theme Sync
 *
 * Purpose:
 * - Re-applies theme when store rehydrates (Zustand persist)
 * - Listens to prefers-color-scheme when theme is 'system'
 */
import { useEffect } from 'react'
import { useThemeStore, getResolvedTheme, applyTheme } from '../store/theme-store'

export function ThemeSync() {
  const theme = useThemeStore((s) => s.theme)

  useEffect(() => {
    const resolved = getResolvedTheme(theme)
    applyTheme(resolved)
  }, [theme])

  useEffect(() => {
    if (theme !== 'system') return
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = () => {
      const resolved = getResolvedTheme('system')
      applyTheme(resolved)
      useThemeStore.setState({ resolved })
    }
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [theme])

  return null
}
