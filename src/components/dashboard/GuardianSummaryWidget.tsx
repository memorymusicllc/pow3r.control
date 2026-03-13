/**
 * pow3r.control - Guardian Summary Widget
 *
 * Purpose:
 * - Gate pass/fail/pending summary from live /api/guardian/status
 * - Visual gate grid showing all gates as hex icons
 * - Click to open full Guardian Dashboard
 */
import { useEffect } from 'react'
import { useControlStore } from '../../store/control-store'
import { useGuardianStore } from '../../store/guardian-store'

export function GuardianSummaryWidget() {
  const toggleGuardianDashboard = useControlStore((s) => s.toggleGuardianDashboard)
  const setViewMode = useControlStore((s) => s.setViewMode)
  const gates = useGuardianStore((s) => s.gates)
  const summary = useGuardianStore((s) => s.summary)
  const fetchGates = useGuardianStore((s) => s.fetchGates)

  useEffect(() => { fetchGates() }, [fetchGates])

  if (gates.length === 0) return null

  return (
    <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-lg px-5 py-4 w-full max-w-[520px]">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-mono text-[10px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">
          Guardian Gates
        </h3>
        <button
          onClick={() => { toggleGuardianDashboard(); setViewMode('2d') }}
          className="font-mono text-[9px] text-[var(--color-cyan)] hover:underline"
        >
          Open dashboard
        </button>
      </div>

      <div className="flex items-center gap-2 mb-3">
        <div className="flex-1 h-2 bg-[var(--color-bg-panel)] rounded-full overflow-hidden flex">
          <div className="h-full bg-[var(--color-success)]" style={{ width: `${(summary.passed / Math.max(summary.total, 1)) * 100}%` }} />
          <div className="h-full bg-[var(--color-error)]" style={{ width: `${(summary.failed / Math.max(summary.total, 1)) * 100}%` }} />
          <div className="h-full bg-[var(--color-amber)]" style={{ width: `${(summary.pending / Math.max(summary.total, 1)) * 100}%` }} />
        </div>
        <span className="font-mono text-[10px] text-[var(--color-text-secondary)]">
          {summary.passed}/{summary.total}
        </span>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {gates.map((gate) => {
          const color = gate.status === 'pass' ? 'var(--color-success)' : gate.status === 'fail' ? 'var(--color-error)' : 'var(--color-amber)'
          const s = 10
          const points = Array.from({ length: 6 }, (_, j) => {
            const angle = (Math.PI / 3) * j - Math.PI / 6
            return `${s + s * Math.cos(angle)},${s + s * Math.sin(angle)}`
          }).join(' ')

          return (
            <div key={gate.gateId} className="group relative">
              <svg width={s * 2} height={s * 2} viewBox={`0 0 ${s * 2} ${s * 2}`}>
                <polygon points={points} fill={`${color}30`} stroke={color} strokeWidth={1} />
              </svg>
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-1.5 py-0.5 bg-[var(--color-bg-panel)] border border-[var(--color-border)] rounded text-[8px] font-mono text-[var(--color-text-secondary)] whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-10">
                {gate.name}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
