/**
 * pow3r.control - Search Bar
 *
 * Purpose:
 * - Global search across all XMAP v7 node fields
 * - Autocomplete with matching suggestions
 * - Keyboard navigation (arrow keys, enter, escape)
 */
import { useState, useRef, useMemo, useCallback } from 'react'
import { useControlStore } from '../../store/control-store'
import { NODE_TYPE_COLORS } from '../../lib/types'

const TYPE_FILTER_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'service', label: 'Service' },
  { value: 'ui', label: 'UI' },
  { value: 'data', label: 'Data' },
  { value: 'workflow', label: 'Workflow' },
  { value: 'mcp_server', label: 'MCP' },
  { value: 'gateway', label: 'Gateway' },
  { value: 'agent', label: 'Agent' },
]

export function SearchBar() {
  const searchQuery = useControlStore((s) => s.searchQuery)
  const setSearchQuery = useControlStore((s) => s.setSearchQuery)
  const selectNode = useControlStore((s) => s.selectNode)
  const config = useControlStore((s) => s.config)

  const [isFocused, setIsFocused] = useState(false)
  const [highlightIdx, setHighlightIdx] = useState(-1)
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const inputRef = useRef<HTMLInputElement>(null)

  const suggestions = useMemo(() => {
    if (!config || !searchQuery || searchQuery.length < 1) return []
    const q = searchQuery.toLowerCase()
    let list = config.nodes.filter(
        (n) =>
          n.name.toLowerCase().includes(q) ||
          n.node_id.toLowerCase().includes(q) ||
          n.node_type.toLowerCase().includes(q) ||
          (n.description?.toLowerCase().includes(q) ?? false) ||
          (n.tech_stack?.some((t) => t.toLowerCase().includes(q)) ?? false)
    )
    if (typeFilter !== 'all') {
      list = list.filter((n) => n.node_type === typeFilter)
    }
    return list.slice(0, 8)
  }, [config, searchQuery, typeFilter])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setHighlightIdx((i) => Math.min(i + 1, suggestions.length - 1))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setHighlightIdx((i) => Math.max(i - 1, -1))
      } else if (e.key === 'Enter' && highlightIdx >= 0) {
        e.preventDefault()
        const node = suggestions[highlightIdx]
        if (node) {
          selectNode(node.node_id)
          setSearchQuery(node.name)
          inputRef.current?.blur()
        }
      } else if (e.key === 'Escape') {
        inputRef.current?.blur()
        setSearchQuery('')
      }
    },
    [suggestions, highlightIdx, selectNode, setSearchQuery]
  )

  return (
    <div className="relative flex items-center gap-2">
      <select
        value={typeFilter}
        onChange={(e) => setTypeFilter(e.target.value)}
        className="px-2 py-1 rounded bg-[var(--color-bg-card)] border border-[var(--color-border)] font-mono text-[9px] text-[var(--color-text-secondary)]"
        title="Filter by type"
      >
        {TYPE_FILTER_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      <div className="flex items-center gap-2 bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-lg px-3 py-1.5">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-muted)" strokeWidth="2">
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.3-4.3" />
        </svg>
        <input
          ref={inputRef}
          type="text"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value)
            setHighlightIdx(-1)
          }}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setTimeout(() => setIsFocused(false), 200)}
          onKeyDown={handleKeyDown}
          placeholder="Search nodes..."
          className="bg-transparent text-xs font-mono text-[var(--color-text-primary)] outline-none placeholder:text-[var(--color-text-muted)] w-40"
        />
        {searchQuery && (
          <button
            onClick={() => {
              setSearchQuery('')
              selectNode(null)
            }}
            className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] text-xs"
          >
            x
          </button>
        )}
      </div>

      {/* Autocomplete dropdown */}
      {isFocused && suggestions.length > 0 && (
        <div className="absolute top-full mt-1 left-0 w-64 bg-[var(--color-bg-panel)] border border-[var(--color-border)] rounded-lg shadow-lg z-30 overflow-hidden">
          {suggestions.map((node, i) => (
            <button
              key={node.node_id}
              className={`w-full text-left px-3 py-1.5 text-xs font-mono flex items-center gap-2 transition-colors ${
                i === highlightIdx
                  ? 'bg-[var(--color-bg-card)]'
                  : 'hover:bg-[var(--color-bg-card)]'
              }`}
              onMouseDown={() => {
                selectNode(node.node_id)
                setSearchQuery(node.name)
              }}
              onMouseEnter={() => setHighlightIdx(i)}
            >
              <div
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: NODE_TYPE_COLORS[node.node_type] ?? '#888' }}
              />
              <span className="truncate text-[var(--color-text-primary)]">{node.name}</span>
              <span className="ml-auto text-[9px] text-[var(--color-text-muted)]">{node.node_type}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
