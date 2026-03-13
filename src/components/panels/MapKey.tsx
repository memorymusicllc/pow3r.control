/**
 * pow3r.control - Map Key / Legend
 *
 * Purpose:
 * - Always-visible legend showing node types, edge types, status colors
 * - Collapsible for space efficiency
 */
import { useState } from 'react'
import { useControlStore } from '../../store/control-store'
import { NODE_TYPE_COLORS, STATUS_COLORS, EDGE_TYPE_STYLES } from '../../lib/types'
import type { NodeType, NodeStatus, EdgeType } from '../../lib/types'

export function MapKey() {
  const showMapKey = useControlStore((s) => s.showMapKey)
  const toggleMapKey = useControlStore((s) => s.toggleMapKey)
  const [expanded, setExpanded] = useState(true)

  if (!showMapKey) return null

  return (
    <div className="absolute bottom-14 right-4 bg-[var(--color-bg-panel)] border border-[var(--color-border)] rounded-lg px-4 py-3 z-10 max-w-52 select-none">
      <button
        className="flex items-center justify-between w-full text-[10px] font-mono text-[var(--color-text-muted)] uppercase tracking-wider"
        onClick={() => setExpanded(!expanded)}
      >
        <span>Map Key</span>
        <span>{expanded ? '-' : '+'}</span>
      </button>

      {expanded && (
        <div className="mt-2 space-y-3">
          {/* Node Types */}
          <div>
            <span className="text-[9px] font-mono text-[var(--color-text-muted)] block mb-1">Node Types</span>
            <div className="grid grid-cols-2 gap-1">
              {(Object.entries(NODE_TYPE_COLORS) as [NodeType, string][]).map(([type, color]) => (
                <div key={type} className="flex items-center gap-1">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
                  <span className="text-[9px] font-mono text-[var(--color-text-secondary)]">{type}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Status Colors */}
          <div>
            <span className="text-[9px] font-mono text-[var(--color-text-muted)] block mb-1">Status</span>
            <div className="grid grid-cols-2 gap-1">
              {(Object.entries(STATUS_COLORS) as [NodeStatus, string][]).map(([status, color]) => (
                <div key={status} className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                  <span className="text-[9px] font-mono text-[var(--color-text-secondary)] capitalize">{status}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Edge Types */}
          <div>
            <span className="text-[9px] font-mono text-[var(--color-text-muted)] block mb-1">Edge Types</span>
            <div className="flex flex-col gap-1">
              {(Object.entries(EDGE_TYPE_STYLES) as [EdgeType, typeof EDGE_TYPE_STYLES.data][]).map(([, style]) => (
                <div key={style.label} className="flex items-center gap-1.5">
                  <svg width="20" height="4">
                    <line
                      x1="0" y1="2" x2="20" y2="2"
                      stroke={style.color}
                      strokeWidth="1.5"
                      strokeDasharray={style.dashArray || undefined}
                    />
                  </svg>
                  <span className="text-[9px] font-mono text-[var(--color-text-secondary)]">{style.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <button
        onClick={toggleMapKey}
        className="text-[8px] font-mono text-[var(--color-text-muted)] mt-2 hover:text-[var(--color-text-secondary)]"
      >
        Hide legend
      </button>
    </div>
  )
}
