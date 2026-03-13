/**
 * pow3r.control - Config Selector
 *
 * Purpose:
 * - Dropdown to switch between ALL available XMAP configs (~45 from API)
 * - Fetches full list from /api/xmap/configs on mount
 * - Shows loading state during config fetch
 */
import { useState, useEffect } from 'react'
import { useControlStore } from '../../store/control-store'
import { fetchAvailableConfigs, loadConfigByName, type ConfigOption } from '../../lib/config-loader'

export function ConfigSelector() {
  const loadConfig = useControlStore((s) => s.loadConfig)
  const config = useControlStore((s) => s.config)
  const [isLoading, setIsLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [configs, setConfigs] = useState<ConfigOption[]>([])

  useEffect(() => {
    fetchAvailableConfigs().then(setConfigs)
  }, [])

  const currentId = config?.metadata.id ?? 'pow3r-platform'

  const handleSelect = async (id: string) => {
    setIsOpen(false)
    setIsLoading(true)
    try {
      const newConfig = await loadConfigByName(id)
      loadConfig(newConfig)
    } catch (err) {
      console.error('Failed to load config:', err)
    }
    setIsLoading(false)
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-2 py-1 rounded bg-[var(--color-bg-card)] border border-[var(--color-border)] hover:border-[var(--color-cyan)] transition-colors"
        disabled={isLoading}
      >
        {isLoading ? (
          <div className="w-3 h-3 border border-[var(--color-cyan)] border-t-transparent rounded-full animate-spin" />
        ) : (
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="var(--color-cyan)" strokeWidth="2">
            <path d="M4 4h16v16H4z" />
            <path d="M4 12h16" />
            <path d="M12 4v16" />
          </svg>
        )}
        <span className="font-mono text-[9px] text-[var(--color-text-secondary)]">
          {configs.find((c) => c.id === currentId)?.name ?? currentId}
        </span>
        <span className="font-mono text-[8px] text-[var(--color-text-muted)] ml-1">
          ({configs.length})
        </span>
        <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-muted)" strokeWidth="2">
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute top-full mt-1 left-0 w-64 max-h-80 overflow-y-auto bg-[var(--color-bg-panel)] border border-[var(--color-border)] rounded-lg shadow-lg z-30">
          {configs.map((opt) => (
            <button
              key={opt.id}
              onClick={() => handleSelect(opt.id)}
              className={`w-full text-left px-3 py-1.5 text-[10px] font-mono flex items-center gap-2 transition-colors hover:bg-[var(--color-bg-card)] ${
                opt.id === currentId ? 'text-[var(--color-cyan)]' : 'text-[var(--color-text-secondary)]'
              }`}
            >
              <div
                className="w-1.5 h-1.5 rounded-full shrink-0"
                style={{ backgroundColor: opt.source === 'remote' ? 'var(--color-purple)' : 'var(--color-success)' }}
              />
              <span className="flex-1 truncate">{opt.name}</span>
              {opt.id === currentId && (
                <span className="text-[8px] text-[var(--color-text-muted)]">active</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
