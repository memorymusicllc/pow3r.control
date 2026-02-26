/**
 * pow3r.control - Active Workflows Widget
 *
 * Purpose:
 * - Shows all workflows from XMAP v7 config
 * - Step count, gate count, type badge
 * - Click to expand workflow in the main view
 */
import { useControlStore } from '../../store/control-store'

export function ActiveWorkflowsWidget() {
  const config = useControlStore((s) => s.config)
  const expandWorkflow = useControlStore((s) => s.expandWorkflow)
  const setViewMode = useControlStore((s) => s.setViewMode)

  if (!config) return null
  const workflows = config.workflows

  return (
    <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-lg p-4 w-full max-w-[520px]">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-mono text-[10px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">
          Workflows
        </h3>
        <span className="font-mono text-[10px] text-[var(--color-text-secondary)]">{workflows.length}</span>
      </div>

      <div className="space-y-2">
        {workflows.map((wf) => (
          <button
            key={wf.workflow_id}
            onClick={() => {
              expandWorkflow(wf.workflow_id)
              setViewMode('2d')
            }}
            className="w-full text-left p-2.5 rounded bg-[var(--color-bg-panel)] border border-[var(--color-border)] hover:border-[var(--color-cyan)] transition-colors"
          >
            <div className="flex items-center justify-between">
              <code className="font-mono text-[10px] text-[var(--color-text-primary)]">{wf.workflow_id}</code>
              <span className="font-mono text-[8px] px-1.5 py-0.5 rounded bg-[var(--color-bg-card)] text-[var(--color-text-secondary)]">
                {wf.workflow_type}
              </span>
            </div>
            <div className="flex items-center gap-3 mt-1.5 font-mono text-[9px] text-[var(--color-text-muted)]">
              <span>{(wf.steps ?? []).length} steps</span>
              <span>{(wf.guardian_gates ?? []).length} gates</span>
              {wf.retry_policy && (
                <span>retry: {wf.retry_policy.max_attempts}x {wf.retry_policy.backoff}</span>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
