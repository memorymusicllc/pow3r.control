/**
 * pow3r.control - Telemetry Widget
 *
 * Purpose:
 * - Real-time event rate visualization
 * - Severity breakdown over recent events
 * - Connection status indicator
 */
import { useXSystemStore } from '../../store/x-system-store'
import { SEVERITY_COLORS } from '../../lib/x-system-types'
import type { XEventSeverity } from '../../lib/x-system-types'

export function TelemetryWidget() {
  const events = useXSystemStore((s) => s.events)
  const eventCount = useXSystemStore((s) => s.eventCount)
  const isConnected = useXSystemStore((s) => s.isConnected)
  const toggleTelemetryPanel = useXSystemStore((s) => s.toggleTelemetryPanel)

  const recent = events.slice(-50)
  const severityCounts: Record<XEventSeverity, number> = {
    critical: 0, high: 0, medium: 0, low: 0, info: 0,
  }
  recent.forEach((e) => { severityCounts[e.severity]++ })

  return (
    <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-lg p-4 w-full max-w-[520px]">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-[var(--color-success)] animate-pulse' : 'bg-[var(--color-error)]'}`} />
          <h3 className="font-mono text-[10px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">
            Telemetry
          </h3>
        </div>
        <button
          onClick={toggleTelemetryPanel}
          className="font-mono text-[9px] text-[var(--color-cyan)] hover:underline"
        >
          Open stream
        </button>
      </div>

      {/* Event counter */}
      <div className="flex items-baseline gap-1 mb-3">
        <span className="font-mono text-3xl font-bold text-[var(--color-cyan)]">{eventCount}</span>
        <span className="font-mono text-[10px] text-[var(--color-text-muted)]">events total</span>
      </div>

      {/* Severity breakdown */}
      <div className="flex gap-1 h-8 mb-2">
        {(Object.entries(severityCounts) as [XEventSeverity, number][])
          .filter(([, count]) => count > 0)
          .map(([sev, count]) => (
            <div
              key={sev}
              className="rounded flex items-end justify-center transition-all"
              style={{
                width: `${Math.max(10, (count / Math.max(recent.length, 1)) * 100)}%`,
                backgroundColor: `${SEVERITY_COLORS[sev]}30`,
                borderBottom: `2px solid ${SEVERITY_COLORS[sev]}`,
              }}
            >
              <span className="font-mono text-[8px]" style={{ color: SEVERITY_COLORS[sev] }}>
                {count}
              </span>
            </div>
          ))}
      </div>
      <div className="flex justify-between font-mono text-[8px] text-[var(--color-text-muted)]">
        <span>Last {recent.length} events</span>
        <span>{isConnected ? 'streaming' : 'disconnected'}</span>
      </div>

      {/* Mini rate chart */}
      <div className="flex gap-px mt-2 h-3">
        {events.slice(-30).map((e, i) => (
          <div
            key={i}
            className="flex-1 rounded-sm"
            style={{ backgroundColor: SEVERITY_COLORS[e.severity], opacity: 0.3 + (i / 30) * 0.7 }}
          />
        ))}
      </div>
    </div>
  )
}
