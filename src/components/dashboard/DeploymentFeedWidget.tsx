/**
 * pow3r.control - Deployment Status Feed Widget
 *
 * Purpose:
 * - Shows recent workflow executions and deployment events
 * - Sources: workflow-execution-store (recent executions)
 * - Live status, duration, success/fail indicators
 */
import { useEffect } from 'react'
import { useWorkflowExecutionStore } from '../../store/workflow-execution-store'

export function DeploymentFeedWidget() {
  const recentExecutions = useWorkflowExecutionStore((s) => s.recentExecutions)

  useEffect(() => {
    useWorkflowExecutionStore.getState().fetchRecentExecutions()
  }, [])

  const recent = recentExecutions.slice(0, 10)

  return (
    <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-lg px-5 py-4 w-full max-w-[520px]">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-mono text-[10px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">
          Recent Executions
        </h3>
        <span className="font-mono text-[9px] text-[var(--color-text-muted)]">
          {recentExecutions.length} total
        </span>
      </div>

      {recent.length === 0 && (
        <p className="font-mono text-[9px] text-[var(--color-text-muted)]">No recent executions</p>
      )}

      <div className="space-y-1.5">
        {recent.map((exec) => {
          const statusColor =
            exec.status === 'completed' ? 'var(--color-success)'
            : exec.status === 'failed' ? 'var(--color-error)'
            : exec.status === 'running' ? 'var(--color-cyan)'
            : 'var(--color-text-muted)'

          return (
            <div key={exec.executionId} className="flex items-center gap-2 p-2 rounded bg-[var(--color-bg-panel)] border border-[var(--color-border)]">
              <div className={`w-2 h-2 rounded-full shrink-0 ${exec.status === 'running' ? 'animate-pulse' : ''}`} style={{ backgroundColor: statusColor }} />
              <div className="flex-1 min-w-0">
                <div className="font-mono text-[10px] text-[var(--color-text-secondary)] truncate">
                  {exec.workflowId || exec.executionId}
                </div>
                <div className="font-mono text-[8px] text-[var(--color-text-muted)]">
                  {exec.description || exec.status}
                  {exec.duration && ` (${Math.round(exec.duration / 1000)}s)`}
                </div>
              </div>
              <span className="font-mono text-[8px] shrink-0" style={{ color: statusColor }}>
                {exec.status}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
