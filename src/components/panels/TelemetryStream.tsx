/**
 * pow3r.control - Telemetry Stream Panel (X-Log Timeline)
 *
 * Purpose:
 * - Scrollable real-time feed of X-System events
 * - Color-coded by severity
 * - Shows source, node, timestamp, message
 * - Severity filter tabs
 * - Auto-scrolls to latest events
 */
import { useRef, useEffect } from 'react'
import { useXSystemStore } from '../../store/x-system-store'
import { SEVERITY_COLORS } from '../../lib/x-system-types'

export function TelemetryStream() {
  const showPanel = useXSystemStore((s) => s.showTelemetryPanel)
  const togglePanel = useXSystemStore((s) => s.toggleTelemetryPanel)
  const events = useXSystemStore((s) => s.events)
  const eventCount = useXSystemStore((s) => s.eventCount)
  const isConnected = useXSystemStore((s) => s.isConnected)
  const telemetryFilter = useXSystemStore((s) => s.telemetryFilter)
  const setFilter = useXSystemStore((s) => s.setTelemetryFilter)

  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [events.length])

  if (!showPanel) return null

  const filteredEvents = telemetryFilter === 'all'
    ? events
    : events.filter((e) => e.severity === telemetryFilter)

  return (
    <div className="absolute bottom-12 left-0 right-0 h-52 bg-[var(--color-bg-panel)] border-t border-[var(--color-border)] z-20 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-[var(--color-border)] shrink-0">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-[var(--color-success)] animate-pulse' : 'bg-[var(--color-error)]'}`} />
          <span className="font-mono text-[10px] font-semibold text-[var(--color-text-primary)]">
            X-System Telemetry
          </span>
          <span className="font-mono text-[9px] text-[var(--color-text-muted)]">
            {eventCount} events
          </span>
        </div>

        <div className="flex items-center gap-1">
          {/* Severity filter pills */}
          {(['all', 'critical', 'high', 'medium', 'low', 'info'] as const).map((sev) => (
            <button
              key={sev}
              onClick={() => setFilter(sev)}
              className={`px-1.5 py-0.5 text-[8px] font-mono rounded transition-colors ${
                telemetryFilter === sev
                  ? 'bg-[var(--color-bg-card)] text-[var(--color-text-primary)]'
                  : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]'
              }`}
              style={telemetryFilter === sev && sev !== 'all' ? { color: SEVERITY_COLORS[sev] } : undefined}
            >
              {sev}
            </button>
          ))}

          <div className="w-px h-3 bg-[var(--color-border)] mx-1" />

          <button
            onClick={togglePanel}
            className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] text-xs px-1"
          >
            x
          </button>
        </div>
      </div>

      {/* Event stream */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto overflow-x-hidden px-1 py-1">
        {filteredEvents.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <span className="font-mono text-[10px] text-[var(--color-text-muted)]">
              {isConnected ? 'Waiting for events...' : 'Not connected'}
            </span>
          </div>
        ) : (
          filteredEvents.slice(-50).map((event) => (
            <div
              key={event.id}
              className="flex items-start gap-2 px-2 py-0.5 hover:bg-[var(--color-bg-card)] rounded text-[10px] font-mono"
            >
              {/* Severity dot */}
              <div
                className="w-1.5 h-1.5 rounded-full mt-1 shrink-0"
                style={{ backgroundColor: SEVERITY_COLORS[event.severity] }}
              />

              {/* Timestamp */}
              <span className="text-[var(--color-text-muted)] shrink-0 w-16">
                {formatTime(event.timestamp)}
              </span>

              {/* Source */}
              <span
                className="shrink-0 w-12 text-right"
                style={{ color: sourceColor(event.source) }}
              >
                {event.source}
              </span>

              {/* Node */}
              {event.nodeId && (
                <span className="text-[var(--color-cyan)] shrink-0 w-24 truncate">
                  {event.nodeId}
                </span>
              )}

              {/* Message */}
              <span className="text-[var(--color-text-secondary)] truncate flex-1">
                {event.message}
              </span>

              {/* Type badge */}
              <span className="text-[var(--color-text-muted)] shrink-0 text-[8px]">
                {event.type}
              </span>
            </div>
          ))
        )}
      </div>

      {/* Rate indicator */}
      <div className="flex items-center gap-2 px-3 py-1 border-t border-[var(--color-border)] shrink-0">
        <div className="flex gap-px flex-1 h-2">
          {events.slice(-40).map((e, i) => (
            <div
              key={i}
              className="flex-1 rounded-sm"
              style={{
                backgroundColor: SEVERITY_COLORS[e.severity],
                opacity: 0.4 + (i / 40) * 0.6,
              }}
            />
          ))}
        </div>
        <span className="font-mono text-[8px] text-[var(--color-text-muted)]">
          {filteredEvents.length} shown
        </span>
      </div>
    </div>
  )
}

function formatTime(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

function sourceColor(source: string): string {
  const map: Record<string, string> = {
    cursor: '#A855F7',
    workflow: '#72BF78',
    mcp: '#FF90BB',
    guardian: '#00E676',
    api: '#60B5FF',
    healing: '#FFB300',
    deploy: '#FF9149',
  }
  return map[source] ?? '#888'
}
