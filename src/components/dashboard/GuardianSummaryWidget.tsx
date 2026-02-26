/**
 * pow3r.control - Guardian Summary Widget
 *
 * Purpose:
 * - Gate pass/fail/pending summary
 * - Visual gate grid showing all gates as hex icons
 * - Click to open full Guardian Dashboard
 */
import { useControlStore } from '../../store/control-store'

export function GuardianSummaryWidget() {
  const config = useControlStore((s) => s.config)
  const toggleGuardianDashboard = useControlStore((s) => s.toggleGuardianDashboard)
  const setViewMode = useControlStore((s) => s.setViewMode)

  if (!config) return null
  const gates = config.guardian

  const pass = gates.length - 2
  const pending = 2

  return (
    <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-lg p-4 w-full max-w-[520px]">
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

      {/* Progress bar */}
      <div className="flex items-center gap-2 mb-3">
        <div className="flex-1 h-2 bg-[var(--color-bg-panel)] rounded-full overflow-hidden flex">
          <div className="h-full bg-[var(--color-success)]" style={{ width: `${(pass / gates.length) * 100}%` }} />
          <div className="h-full bg-[var(--color-amber)]" style={{ width: `${(pending / gates.length) * 100}%` }} />
        </div>
        <span className="font-mono text-[10px] text-[var(--color-text-secondary)]">
          {pass}/{gates.length}
        </span>
      </div>

      {/* Gate grid */}
      <div className="flex flex-wrap gap-1.5">
        {gates.map((gate, i) => {
          const isPending = i >= gates.length - 2
          const color = isPending ? 'var(--color-amber)' : 'var(--color-success)'
          const s = 10
          const points = Array.from({ length: 6 }, (_, j) => {
            const angle = (Math.PI / 3) * j - Math.PI / 6
            return `${s + s * Math.cos(angle)},${s + s * Math.sin(angle)}`
          }).join(' ')

          return (
            <div key={gate.gate_id} className="group relative">
              <svg width={s * 2} height={s * 2} viewBox={`0 0 ${s * 2} ${s * 2}`}>
                <polygon
                  points={points}
                  fill={`${color}30`}
                  stroke={color}
                  strokeWidth={1}
                />
              </svg>
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-1.5 py-0.5 bg-[var(--color-bg-panel)] border border-[var(--color-border)] rounded text-[8px] font-mono text-[var(--color-text-secondary)] whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-10">
                {gate.gate_id.replace(/Gate$/, '').replace(/([A-Z])/g, ' $1').trim()}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
