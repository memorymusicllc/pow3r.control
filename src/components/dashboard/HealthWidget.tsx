/**
 * pow3r.control - Health Widget
 *
 * Purpose:
 * - System compliance gauge (radial)
 * - Node health breakdown by status (bar chart)
 * - Manifest status indicator
 */
import { useMemo } from 'react'
import { useControlStore } from '../../store/control-store'
import { STATUS_COLORS } from '../../lib/types'
import type { NodeStatus } from '../../lib/types'

export function HealthWidget() {
  const config = useControlStore((s) => s.config)
  const configLoadedAt = useControlStore((s) => s.configLoadedAt)
  const setViewMode = useControlStore((s) => s.setViewMode)
  if (!config) return null

  const staleMinutes = configLoadedAt
    ? Math.floor((Date.now() - new Date(configLoadedAt).getTime()) / 60000)
    : null

  const score = config.compliance.compliance_score ?? 0
  const pct = Math.round(score * 100)

  const breakdown = useMemo(() => {
    const counts: Partial<Record<NodeStatus, number>> = {}
    config.nodes.forEach((n) => {
      counts[n.status] = (counts[n.status] ?? 0) + 1
    })
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([status, count]) => ({
        status: status as NodeStatus,
        count,
        pct: (count / config.nodes.length) * 100,
      }))
  }, [config.nodes])

  const scoreColor = pct > 80 ? 'var(--color-success)' : pct > 50 ? 'var(--color-amber)' : 'var(--color-error)'

  const circumference = 2 * Math.PI * 40
  const offset = circumference - (score * circumference)

  return (
    <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-lg px-5 py-4 w-full max-w-[520px]">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-mono text-[10px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">
          System Health
        </h3>
        <button
          onClick={() => setViewMode('dashboard')}
          className="font-mono text-[9px] text-[var(--color-cyan)] hover:underline min-h-[32px] px-2"
          title="View dashboard"
        >
          View details
        </button>
      </div>

      <div className="flex items-center gap-6">
        {/* Radial gauge */}
        <div className="relative shrink-0">
          <svg width="96" height="96" viewBox="0 0 96 96">
            <circle cx="48" cy="48" r="40" fill="none" stroke="var(--color-bg-panel)" strokeWidth="6" />
            <circle
              cx="48" cy="48" r="40"
              fill="none"
              stroke={scoreColor}
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              transform="rotate(-90 48 48)"
              className="transition-all duration-1000"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-mono text-2xl font-bold" style={{ color: scoreColor }}>
              {pct}
            </span>
            <span className="font-mono text-[8px] text-[var(--color-text-muted)]">compliance</span>
          </div>
        </div>

        {/* Status breakdown */}
        <div className="flex-1 space-y-1.5">
          {breakdown.map(({ status, count, pct }) => (
            <div key={status} className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: STATUS_COLORS[status] }} />
              <span className="font-mono text-[10px] text-[var(--color-text-secondary)] w-16 capitalize">{status}</span>
              <div className="flex-1 h-1.5 bg-[var(--color-bg-panel)] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${pct}%`, backgroundColor: STATUS_COLORS[status] }}
                />
              </div>
              <span className="font-mono text-[10px] text-[var(--color-text-muted)] w-4 text-right">{count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Data freshness */}
      {configLoadedAt && (
        <div className="flex items-center justify-between mt-2 font-mono text-[9px] text-[var(--color-text-muted)]">
          <span>Last updated: {new Date(configLoadedAt).toLocaleTimeString()}</span>
          {staleMinutes != null && staleMinutes >= 5 && (
            <span className="text-[var(--color-amber)]">Data may be stale ({staleMinutes} min ago)</span>
          )}
        </div>
      )}

      {/* Manifest */}
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-[var(--color-border)]">
        <span className="font-mono text-[9px] text-[var(--color-text-muted)]">Manifest</span>
        <span className={`font-mono text-[9px] px-1.5 py-0.5 rounded uppercase ${
          config.manifest.manifest_status === 'deployed'
            ? 'bg-[#00E67615] text-[var(--color-success)]'
            : 'bg-[#FFB30015] text-[var(--color-amber)]'
        }`}>
          {config.manifest.manifest_status}
        </span>
      </div>
    </div>
  )
}
