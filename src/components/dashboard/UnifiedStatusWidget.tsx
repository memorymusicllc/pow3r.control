/**
 * pow3r.control - Unified Status Widget
 *
 * Purpose:
 * - Cross-layer status combining XMAP nodes + Plans + X-Files + Workflows
 * - Single dashboard card with aggregated metrics
 * - Live data from plan-store, x-system-store, workflow-execution-store, guardian-store
 */
import { useEffect } from 'react'
import { useXSystemStore } from '../../store/x-system-store'
import { useWorkflowExecutionStore } from '../../store/workflow-execution-store'
import { useGuardianStore } from '../../store/guardian-store'
import { usePlanStore } from '../../store/plan-store'
import { useControlStore } from '../../store/control-store'

export function UnifiedStatusWidget() {
  const config = useControlStore((s) => s.config)
  const xfilesCases = useXSystemStore((s) => s.xfilesCases)
  const isConnected = useXSystemStore((s) => s.isConnected)
  const eventCount = useXSystemStore((s) => s.eventCount)
  const recentExecutions = useWorkflowExecutionStore((s) => s.recentExecutions)
  const guardianSummary = useGuardianStore((s) => s.summary)
  const plans = usePlanStore((s) => s.plans)
  const inProgress = usePlanStore((s) => s.inProgress)
  const incompletePlans = usePlanStore((s) => s.incompletePlans)

  useEffect(() => {
    usePlanStore.getState().fetchPlans()
    useGuardianStore.getState().fetchGates()
    useWorkflowExecutionStore.getState().fetchRecentExecutions()
  }, [])

  const nodeCount = config?.nodes?.length ?? 0
  const blockedNodes = config?.nodes?.filter(
    (n) =>
      (n.developmentStatus?.blockers?.length ?? 0) > 0 || !!n.developmentStatus?.lastError
  ).length ?? 0
  const openCases = xfilesCases.filter((c) => c.status !== 'closed').length
  const runningWorkflows = recentExecutions.filter((e) => e.status === 'running').length
  const recentFailed = recentExecutions.filter((e) => e.status === 'failed').length

  const healthScore = guardianSummary.total > 0
    ? Math.round((guardianSummary.passed / guardianSummary.total) * 100)
    : 0

  return (
    <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-lg px-5 py-4 w-full max-w-[520px]">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-mono text-[10px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">
          Platform Status
        </h3>
        <div className="flex items-center gap-1.5">
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-[var(--color-success)]' : 'bg-[var(--color-error)]'}`} />
          <span className="font-mono text-[8px] text-[var(--color-text-muted)]">
            {isConnected ? 'Live' : 'Offline'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-3">
        <MetricCard label="Plans in progress" value={incompletePlans} subtext={inProgress ? inProgress.name : undefined} color="var(--color-cyan)" />
        <MetricCard label="XMAP blocked" value={blockedNodes} color={blockedNodes > 0 ? 'var(--color-error)' : 'var(--color-success)'} />
        <MetricCard label="X-Files open" value={openCases} color={openCases > 0 ? 'var(--color-error)' : 'var(--color-success)'} />
        <MetricCard label="Workflows running" value={runningWorkflows} subtext={recentFailed > 0 ? `${recentFailed} failed` : undefined} color="var(--color-amber)" />
        <MetricCard label="Guardian health" value={`${healthScore}%`} subtext={`${guardianSummary.passed}/${guardianSummary.total} pass`} color={healthScore >= 80 ? 'var(--color-success)' : 'var(--color-amber)'} />
      </div>

      <div className="flex items-center gap-4 font-mono text-[9px] text-[var(--color-text-muted)]">
        <span>{nodeCount} XMAP nodes</span>
        <span>{plans.length} total plans</span>
        <span>{eventCount} events</span>
      </div>
    </div>
  )
}

function MetricCard({ label, value, subtext, color }: { label: string; value: number | string; subtext?: string; color: string }) {
  return (
    <div className="px-3 py-2 rounded bg-[var(--color-bg-panel)] border border-[var(--color-border)]">
      <div className="font-mono text-lg font-bold" style={{ color }}>{value}</div>
      <div className="font-mono text-[9px] text-[var(--color-text-muted)]">{label}</div>
      {subtext && <div className="font-mono text-[8px] text-[var(--color-text-muted)] mt-0.5">{subtext}</div>}
    </div>
  )
}
