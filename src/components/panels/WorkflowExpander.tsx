/**
 * pow3r.control - Workflow Expander Panel
 *
 * Purpose:
 * - Expands a workflow into its constituent steps
 * - Shows step sequence with animated progress indicators
 * - Guardian gates inline at enforcement points
 * - Breadcrumb navigation for drill-down depth
 * - Retry policy and evidence policy visualization
 *
 * Agent Instructions:
 * - Triggered when user clicks a workflow-type node or workflow entry
 * - Workflow data comes from XMAP v7 `workflows[]`
 * - Steps reference nodes by node_id
 */
import { useControlStore } from '../../store/control-store'
import type { WorkflowStep, GuardianGate } from '../../lib/types'

export function WorkflowExpander() {
  const config = useControlStore((s) => s.config)
  const expandedWorkflowId = useControlStore((s) => s.expandedWorkflowId)
  const breadcrumb = useControlStore((s) => s.workflowBreadcrumb)
  const expandWorkflow = useControlStore((s) => s.expandWorkflow)
  const popWorkflowBreadcrumb = useControlStore((s) => s.popWorkflowBreadcrumb)

  if (!config || !expandedWorkflowId) return null

  const workflow = config.workflows.find((w) => w.workflow_id === expandedWorkflowId)
  if (!workflow) return null

  const workflowGates = (workflow.guardian_gates ?? [])
    .map((gId) => config.guardian.find((g) => g.gate_id === gId))
    .filter(Boolean) as GuardianGate[]

  return (
    <div className="absolute top-0 left-0 w-80 h-full bg-[var(--color-bg-panel)] border-r border-[var(--color-border)] overflow-y-auto z-25">
      {/* Header */}
      <div className="sticky top-0 bg-[var(--color-bg-panel)] border-b border-[var(--color-border)] p-3 z-10">
        <div className="flex items-center justify-between">
          <h3 className="font-mono text-xs font-semibold text-[var(--color-text-primary)]">
            Workflow
          </h3>
          <button
            onClick={() => expandWorkflow(null)}
            className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] text-lg leading-none"
          >
            x
          </button>
        </div>

        {/* Breadcrumb */}
        {breadcrumb.length > 1 && (
          <div className="flex items-center gap-1 mt-1.5 font-mono text-[9px]">
            <button
              onClick={popWorkflowBreadcrumb}
              className="text-[var(--color-cyan)] hover:underline"
            >
              back
            </button>
            {breadcrumb.map((id, i) => (
              <span key={id} className="text-[var(--color-text-muted)]">
                {i > 0 && ' / '}
                <span className={i === breadcrumb.length - 1 ? 'text-[var(--color-text-primary)]' : ''}>
                  {id}
                </span>
              </span>
            ))}
          </div>
        )}

        <div className="mt-2">
          <code className="text-[10px] text-[var(--color-cyan)]">{workflow.workflow_id}</code>
          <span className="ml-2 px-1.5 py-0.5 text-[9px] font-mono rounded bg-[var(--color-bg-card)] text-[var(--color-text-secondary)]">
            {workflow.workflow_type}
          </span>
        </div>
      </div>

      <div className="p-3 space-y-4">
        {/* Steps */}
        <Section title="Steps">
          <div className="relative">
            {/* Vertical flow line */}
            <div className="absolute left-3 top-3 bottom-3 w-px bg-[var(--color-border)]" />

            {(workflow.steps ?? []).map((step, i) => (
              <StepRow
                key={step.step_id}
                step={step}
                index={i}
                total={(workflow.steps ?? []).length}
                nodeName={config.nodes.find((n) => n.node_id === step.node)?.name ?? step.node}
              />
            ))}
          </div>
        </Section>

        {/* Guardian Gates on this workflow */}
        {workflowGates.length > 0 && (
          <Section title={`Guardian Gates (${workflowGates.length})`}>
            <div className="space-y-1.5">
              {workflowGates.map((gate) => (
                <div
                  key={gate.gate_id}
                  className="flex items-center gap-2 p-1.5 rounded bg-[var(--color-bg-card)] border border-[var(--color-border)]"
                >
                  <GateHex size={16} phase={gate.type} />
                  <div className="flex-1 min-w-0">
                    <span className="font-mono text-[10px] text-[var(--color-text-primary)] truncate block">
                      {gate.gate_id.replace(/Gate$/, '').replace(/([A-Z])/g, ' $1').trim()}
                    </span>
                    <span className="font-mono text-[8px] text-[var(--color-text-muted)]">
                      {gate.type} | {gate.evaluation_policy} | {gate.action_on_fail}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Retry Policy */}
        {workflow.retry_policy && (
          <Section title="Retry Policy">
            <div className="font-mono text-[10px] space-y-1">
              <Row label="Max Attempts" value={String(workflow.retry_policy.max_attempts)} />
              <Row label="Backoff" value={workflow.retry_policy.backoff} />
            </div>
            {/* Visual backoff curve */}
            <div className="mt-2 flex items-end gap-1 h-8">
              {Array.from({ length: workflow.retry_policy.max_attempts }, (_, i) => {
                const height = workflow.retry_policy!.backoff === 'exponential'
                  ? Math.pow(2, i) / Math.pow(2, workflow.retry_policy!.max_attempts - 1)
                  : (i + 1) / workflow.retry_policy!.max_attempts
                return (
                  <div
                    key={i}
                    className="flex-1 rounded-t"
                    style={{
                      height: `${height * 100}%`,
                      backgroundColor: i === 0 ? 'var(--color-cyan)' : 'var(--color-amber)',
                      opacity: 0.6,
                    }}
                  />
                )
              })}
            </div>
            <div className="font-mono text-[8px] text-[var(--color-text-muted)] mt-0.5 text-center">
              Retry delay ({workflow.retry_policy.backoff})
            </div>
          </Section>
        )}

        {/* Evidence Policy */}
        {workflow.evidence_policy && (
          <Section title="Required Evidence">
            <div className="flex flex-wrap gap-1">
              {(workflow.evidence_policy.required_artifacts ?? []).map((art) => (
                <span
                  key={art}
                  className="px-1.5 py-0.5 text-[9px] font-mono rounded border border-[var(--color-border)] text-[var(--color-purple)]"
                >
                  {art}
                </span>
              ))}
            </div>
          </Section>
        )}
      </div>
    </div>
  )
}

function StepRow({ step, index, total, nodeName }: {
  step: WorkflowStep
  index: number
  total: number
  nodeName: string
}) {
  const isFirst = index === 0
  const isLast = index === total - 1

  return (
    <div className="relative flex items-start gap-3 pb-3">
      {/* Step indicator */}
      <div className="relative z-10 w-6 h-6 shrink-0 flex items-center justify-center">
        <div
          className="w-4 h-4 rounded-full border-2"
          style={{
            borderColor: isFirst ? 'var(--color-cyan)' : isLast ? 'var(--color-success)' : 'var(--color-text-muted)',
            backgroundColor: isFirst ? 'var(--color-cyan)' : 'transparent',
          }}
        />
      </div>

      {/* Step content */}
      <div className="flex-1 min-w-0 pt-0.5">
        <div className="flex items-center gap-1.5">
          <span className="font-mono text-[10px] font-semibold text-[var(--color-text-primary)]">
            {step.step_id}
          </span>
        </div>
        <div className="font-mono text-[9px] text-[var(--color-text-secondary)] mt-0.5">
          {nodeName} <span className="text-[var(--color-text-muted)]">.</span>{' '}
          <span className="text-[var(--color-cyan)]">{step.action}</span>
        </div>
      </div>
    </div>
  )
}

function GateHex({ size, phase }: { size: number; phase: string }) {
  const color = phase === 'pre-commit' ? 'var(--color-cyan)'
    : phase === 'pre-deploy' ? 'var(--color-amber)'
    : 'var(--color-success)'

  const s = size / 2
  const points = Array.from({ length: 6 }, (_, i) => {
    const angle = (Math.PI / 3) * i - Math.PI / 6
    return `${s + s * Math.cos(angle)},${s + s * Math.sin(angle)}`
  }).join(' ')

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <polygon
        points={points}
        fill={`${color}30`}
        stroke={color}
        strokeWidth={1}
      />
    </svg>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h4 className="font-mono text-[10px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-1.5">
        {title}
      </h4>
      {children}
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-[var(--color-text-muted)]">{label}</span>
      <span className="text-[var(--color-text-secondary)]">{value}</span>
    </div>
  )
}
