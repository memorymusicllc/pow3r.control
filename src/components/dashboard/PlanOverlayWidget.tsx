/**
 * pow3r.control - Plan / Task Overlay Widget
 *
 * Purpose:
 * - Shows current plan from plan-memory API
 * - Tasks remaining, implementation level
 * - List of incomplete plans with progress bars
 */
import { useEffect } from 'react'
import { usePlanStore } from '../../store/plan-store'

export function PlanOverlayWidget() {
  const plans = usePlanStore((s) => s.plans)
  const inProgress = usePlanStore((s) => s.inProgress)
  const incompletePlans = usePlanStore((s) => s.incompletePlans)
  const totalPlans = usePlanStore((s) => s.totalPlans)
  const loading = usePlanStore((s) => s.loading)

  useEffect(() => {
    usePlanStore.getState().fetchPlans()
  }, [])

  const incomplete = plans.filter((p) => (p.implementationLevel ?? 0) < 100).slice(0, 8)

  return (
    <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-lg px-5 py-4 w-full max-w-[520px]">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-mono text-[10px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">
          Plans & Tasks
        </h3>
        <span className="font-mono text-[9px] text-[var(--color-text-muted)]">
          {incompletePlans}/{totalPlans} incomplete
        </span>
      </div>

      {loading && <p className="font-mono text-[9px] text-[var(--color-text-muted)]">Loading...</p>}

      {inProgress && (
        <div className="mb-3 p-3 rounded bg-[var(--color-cyan)]10 border border-[var(--color-cyan)]30">
          <div className="font-mono text-[10px] text-[var(--color-cyan)] font-semibold">{inProgress.name}</div>
          <div className="flex items-center gap-2 mt-1">
            <div className="flex-1 h-1.5 bg-[var(--color-bg-panel)] rounded-full overflow-hidden">
              <div className="h-full bg-[var(--color-cyan)]" style={{ width: `${inProgress.implementationLevel ?? 0}%` }} />
            </div>
            <span className="font-mono text-[9px] text-[var(--color-text-secondary)]">{inProgress.implementationLevel ?? 0}%</span>
          </div>
          {inProgress.todosTotal != null && (
            <div className="font-mono text-[8px] text-[var(--color-text-muted)] mt-1">
              {inProgress.todosCompleted ?? 0}/{inProgress.todosTotal} tasks
            </div>
          )}
        </div>
      )}

      <div className="space-y-1.5">
        {incomplete.map((p) => (
          <div key={p.id} className="flex items-center gap-2">
            <div className="flex-1 min-w-0">
              <div className="font-mono text-[9px] text-[var(--color-text-secondary)] truncate">{p.name}</div>
            </div>
            <div className="w-16 h-1 bg-[var(--color-bg-panel)] rounded-full overflow-hidden shrink-0">
              <div className="h-full bg-[var(--color-success)]" style={{ width: `${p.implementationLevel ?? 0}%` }} />
            </div>
            <span className="font-mono text-[8px] text-[var(--color-text-muted)] w-8 text-right">{p.implementationLevel ?? 0}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}
