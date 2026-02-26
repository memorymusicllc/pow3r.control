/**
 * pow3r.control - Config Leaf Viewer
 *
 * Purpose:
 * - Deepest-level toggle/value inspection from Component Factory
 * - Config chain source tracing
 */
import { useState } from 'react'

export interface ConfigLeaf {
  path: string
  key: string
  value: unknown
  type: 'boolean' | 'string' | 'number' | 'object' | 'array'
  source?: string
}

interface ConfigLeafViewerProps {
  leaves?: ConfigLeaf[]
  onClose?: () => void
}

const DEMO_LEAVES: ConfigLeaf[] = [
  { path: 'writer.generation', key: 'generateVoice', value: true, type: 'boolean', source: 'configs/writer.pow3r.json' },
  { path: 'writer.generation', key: 'generateMusic', value: true, type: 'boolean', source: 'configs/writer.pow3r.json' },
  { path: 'writer.generation', key: 'generateVideo', value: false, type: 'boolean', source: 'configs/writer.pow3r.json' },
  { path: 'writer.generation', key: 'enableTelemetry', value: true, type: 'boolean', source: 'configs/writer.pow3r.json' },
  { path: 'writer.model', key: 'provider', value: 'gemini', type: 'string', source: 'configs/writer.pow3r.json' },
  { path: 'writer.model', key: 'model', value: 'gemini-2.5-flash', type: 'string', source: 'configs/writer.pow3r.json' },
  { path: 'writer.model', key: 'maxRetries', value: 3, type: 'number', source: 'configs/writer.pow3r.json' },
  { path: 'writer.model', key: 'timeout', value: 30000, type: 'number', source: 'configs/writer.pow3r.json' },
]

export function ConfigLeafViewer({ leaves = DEMO_LEAVES, onClose }: ConfigLeafViewerProps) {
  const [filter, setFilter] = useState('')

  const filtered = filter
    ? leaves.filter(
        (l) =>
          l.key.toLowerCase().includes(filter.toLowerCase()) ||
          l.path.toLowerCase().includes(filter.toLowerCase())
      )
    : leaves

  return (
    <div className="absolute bottom-4 right-4 w-96 max-w-[90vw] max-h-80 bg-[var(--color-bg-panel)] border border-[var(--color-border)] rounded-lg shadow-xl overflow-hidden z-30">
      <div className="p-2 border-b border-[var(--color-border)] flex items-center justify-between">
        <h4 className="font-mono text-[10px] font-semibold text-[var(--color-text-muted)] uppercase">
          Config Leaf Viewer
        </h4>
        {onClose && (
          <button onClick={onClose} className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]">
            x
          </button>
        )}
      </div>
      <div className="p-2 border-b border-[var(--color-border)]">
        <input
          type="search"
          placeholder="Filter by key or path..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="w-full px-2 py-1 rounded bg-[var(--color-bg-deep)] border border-[var(--color-border)] font-mono text-[10px]"
        />
      </div>
      <div className="overflow-y-auto max-h-48 p-2 space-y-1">
        {filtered.map((leaf, i) => (
          <div
            key={`${leaf.path}-${leaf.key}-${i}`}
            className="flex items-center justify-between gap-2 p-2 rounded bg-[var(--color-bg-card)] border border-[var(--color-border)]"
          >
            <div className="min-w-0 flex-1">
              <div className="font-mono text-[10px] text-[var(--color-cyan)] truncate">
                {leaf.path}.{leaf.key}
              </div>
              {leaf.source && (
                <div className="font-mono text-[8px] text-[var(--color-text-muted)] truncate" title={leaf.source}>
                  {leaf.source}
                </div>
              )}
            </div>
            <div className="shrink-0">
              {leaf.type === 'boolean' ? (
                <span
                  className={`font-mono text-[10px] px-1.5 py-0.5 rounded ${
                    leaf.value ? 'bg-[var(--color-success)]20 text-[var(--color-success)]' : 'bg-[var(--color-amber)]20 text-[var(--color-amber)]'
                  }`}
                >
                  {String(leaf.value)}
                </span>
              ) : (
                <span className="font-mono text-[10px] text-[var(--color-text-secondary)]">
                  {typeof leaf.value === 'object' ? JSON.stringify(leaf.value) : String(leaf.value)}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
