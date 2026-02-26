/**
 * pow3r.control - Timeline View
 *
 * Purpose:
 * - Horizontal timeline of X-System events, workflow executions, deployments
 * - Event markers colored by severity/type
 * - Click event to highlight related node in the graph
 * - Time range filtering
 * - Provenance chain visualization (config changes over time)
 *
 * Agent Instructions:
 * - Events from X-System store, workflows from control store
 * - Timeline auto-scrolls to latest events
 * - Clicking an event selects the related node and switches to 2D view
 */
import { useRef, useEffect, useMemo, useState } from 'react'
import { useXSystemStore } from '../../store/x-system-store'
import { useControlStore } from '../../store/control-store'
import { SEVERITY_COLORS } from '../../lib/x-system-types'
import { NODE_TYPE_COLORS } from '../../lib/types'
import type { XStreamEvent } from '../../lib/x-system-types'

type TimeRange = '1m' | '5m' | '15m' | '1h' | 'all'

export function TimelineView() {
  const events = useXSystemStore((s) => s.events)
  const isConnected = useXSystemStore((s) => s.isConnected)
  const config = useControlStore((s) => s.config)
  const selectNode = useControlStore((s) => s.selectNode)
  const setViewMode = useControlStore((s) => s.setViewMode)

  const scrollRef = useRef<HTMLDivElement>(null)
  const [timeRange, setTimeRange] = useState<TimeRange>('all')
  const [hoveredEvent, setHoveredEvent] = useState<string | null>(null)

  const filteredEvents = useMemo(() => {
    if (timeRange === 'all') return events
    const now = Date.now()
    const ranges: Record<TimeRange, number> = {
      '1m': 60_000, '5m': 300_000, '15m': 900_000, '1h': 3_600_000, all: Infinity,
    }
    const cutoff = now - ranges[timeRange]
    return events.filter((e) => new Date(e.timestamp).getTime() > cutoff)
  }, [events, timeRange])

  const nodeIds = useMemo(() => {
    const ids = new Set<string>()
    filteredEvents.forEach((e) => { if (e.nodeId) ids.add(e.nodeId) })
    return Array.from(ids)
  }, [filteredEvents])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollLeft = scrollRef.current.scrollWidth
    }
  }, [filteredEvents.length])

  const handleEventClick = (event: XStreamEvent) => {
    if (event.nodeId) {
      selectNode(event.nodeId)
      setViewMode('2d')
    }
  }

  const timeSpan = useMemo(() => {
    if (filteredEvents.length < 2) return 1
    const first = new Date(filteredEvents[0].timestamp).getTime()
    const last = new Date(filteredEvents[filteredEvents.length - 1].timestamp).getTime()
    return Math.max(last - first, 1000)
  }, [filteredEvents])

  const firstTime = filteredEvents.length > 0 ? new Date(filteredEvents[0].timestamp).getTime() : Date.now()

  return (
    <div className="w-full h-full flex flex-col bg-[var(--color-bg-deep)]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-[var(--color-border)] shrink-0">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-[var(--color-success)] animate-pulse' : 'bg-[var(--color-error)]'}`} />
          <span className="font-mono text-[10px] font-semibold text-[var(--color-text-primary)]">
            Event Timeline
          </span>
          <span className="font-mono text-[9px] text-[var(--color-text-muted)]">
            {filteredEvents.length} events
          </span>
        </div>

        <div className="flex items-center gap-1">
          {(['1m', '5m', '15m', '1h', 'all'] as TimeRange[]).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-2 py-0.5 text-[9px] font-mono rounded transition-colors ${
                timeRange === range
                  ? 'bg-[var(--color-bg-card)] text-[var(--color-cyan)]'
                  : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]'
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {/* Node swim lanes */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {/* Lane headers */}
        <div className="flex shrink-0 border-b border-[var(--color-border)]">
          <div className="w-28 shrink-0 px-2 py-1 border-r border-[var(--color-border)]">
            <span className="font-mono text-[8px] text-[var(--color-text-muted)] uppercase">Node</span>
          </div>
          <div className="flex-1 px-2 py-1 flex items-center justify-between">
            <span className="font-mono text-[8px] text-[var(--color-text-muted)]">
              {filteredEvents.length > 0 ? formatTime(filteredEvents[0].timestamp) : '--'}
            </span>
            <span className="font-mono text-[8px] text-[var(--color-text-muted)]">
              {filteredEvents.length > 0 ? formatTime(filteredEvents[filteredEvents.length - 1].timestamp) : '--'}
            </span>
          </div>
        </div>

        {/* Lanes */}
        <div className="flex-1 overflow-y-auto">
          {nodeIds.map((nodeId) => {
            const node = config?.nodes.find((n) => n.node_id === nodeId)
            const nodeEvents = filteredEvents.filter((e) => e.nodeId === nodeId)
            const nodeColor = node ? NODE_TYPE_COLORS[node.node_type] ?? '#888' : '#888'

            return (
              <div key={nodeId} className="flex border-b border-[var(--color-border)] hover:bg-[var(--color-bg-surface)]">
                {/* Lane label */}
                <div className="w-28 shrink-0 px-2 py-2 border-r border-[var(--color-border)] flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: nodeColor }} />
                  <span className="font-mono text-[9px] text-[var(--color-text-secondary)] truncate">
                    {node?.name ?? nodeId}
                  </span>
                </div>

                {/* Event dots */}
                <div ref={scrollRef} className="flex-1 relative h-10 overflow-x-auto">
                  <div className="absolute inset-0" style={{ minWidth: Math.max(600, filteredEvents.length * 8) }}>
                    {nodeEvents.map((event) => {
                      const t = new Date(event.timestamp).getTime()
                      const x = ((t - firstTime) / timeSpan) * 100
                      const isHovered = hoveredEvent === event.id

                      return (
                        <div
                          key={event.id}
                          className="absolute top-1/2 -translate-y-1/2 cursor-pointer transition-transform"
                          style={{ left: `${Math.min(x, 99)}%` }}
                          onClick={() => handleEventClick(event)}
                          onMouseEnter={() => setHoveredEvent(event.id)}
                          onMouseLeave={() => setHoveredEvent(null)}
                        >
                          <div
                            className={`rounded-full ${isHovered ? 'scale-150' : ''} transition-transform`}
                            style={{
                              width: isHovered ? 8 : 5,
                              height: isHovered ? 8 : 5,
                              backgroundColor: SEVERITY_COLORS[event.severity],
                              boxShadow: isHovered ? `0 0 8px ${SEVERITY_COLORS[event.severity]}` : 'none',
                            }}
                          />
                          {isHovered && (
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-1 bg-[var(--color-bg-panel)] border border-[var(--color-border)] rounded shadow-lg z-20 whitespace-nowrap">
                              <div className="font-mono text-[9px] text-[var(--color-text-primary)]">{event.message}</div>
                              <div className="font-mono text-[8px] text-[var(--color-text-muted)] mt-0.5">
                                {formatTime(event.timestamp)} | {event.source} | {event.severity}
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            )
          })}

          {nodeIds.length === 0 && (
            <div className="flex items-center justify-center h-32">
              <span className="font-mono text-[10px] text-[var(--color-text-muted)]">
                {isConnected ? 'Waiting for events...' : 'Not connected to X-System'}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Bottom summary bar */}
      <div className="flex items-center gap-3 px-4 py-1.5 border-t border-[var(--color-border)] shrink-0">
        <div className="flex gap-px flex-1 h-2">
          {filteredEvents.slice(-60).map((e, i) => (
            <div
              key={i}
              className="flex-1 rounded-sm"
              style={{
                backgroundColor: SEVERITY_COLORS[e.severity],
                opacity: 0.3 + (i / 60) * 0.7,
              }}
            />
          ))}
        </div>
        <span className="font-mono text-[8px] text-[var(--color-text-muted)]">
          {nodeIds.length} nodes | {filteredEvents.length} events
        </span>
      </div>
    </div>
  )
}

function formatTime(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })
}
