/**
 * pow3r.control - Workflow Orchestrator Live
 *
 * Purpose:
 * - Step DAG visualization with live execution timeline
 * - Real-time step states: pending -> running -> success/fail
 * - Guardian gate checkpoints, evidence indicators
 * - MCP packet viewer for current step
 */
import { useState, useEffect } from 'react'
import { useControlStore } from '../../store/control-store'
import { useWorkflowExecutionStore } from '../../store/workflow-execution-store'
import { fetchWorkflowView } from '../../lib/workflow-library-api'
import { McpPacketViewer } from '../panels/McpPacketViewer'
import type { WorkflowStep, GuardianGate, XmapWorkflow } from '../../lib/types'

interface WorkflowOrchestratorLiveProps {
  workflowId: string
  onClose: () => void
}

function inferMcpRequest(step: WorkflowStep): { name: string; server?: string; arguments?: Record<string, unknown> } {
  if (step.step_id.includes('pkg')) return { name: 'pkg_hybrid', server: 'pkg', arguments: { query: '...', topK: 10 } }
  if (step.step_id.includes('guardian')) return { name: 'guardian_check_gates', server: 'guardian', arguments: {} }
  if (step.step_id.includes('credential')) return { name: 'pass_preflight_all', server: 'pow3r', arguments: { requiredProviders: ['gemini'] } }
  return { name: step.action, server: step.node, arguments: {} }
}

function defToWorkflow(def: Record<string, unknown>, id: string): XmapWorkflow | null {
  const rawSteps = (def.steps ?? []) as Array<Record<string, unknown>>
  const steps: WorkflowStep[] = rawSteps.map((s) => ({
    step_id: String(s.step_id ?? s.stepId ?? s.id ?? ''),
    node: String(s.node ?? s.server ?? 'unknown'),
    action: String(s.action ?? s.tool ?? 'unknown'),
  }))
  return {
    workflow_id: id,
    workflow_type: (def.workflow_type ?? def.type ?? 'deployment') as XmapWorkflow['workflow_type'],
    steps,
    guardian_gates: (def.guardian_gates ?? []) as string[],
  }
}

export function WorkflowOrchestratorLive({ workflowId, onClose }: WorkflowOrchestratorLiveProps) {
  const config = useControlStore((s) => s.config)
  const executions = useWorkflowExecutionStore((s) => s.executions[workflowId] ?? [])
  const startSimulatedRun = useWorkflowExecutionStore((s) => s.startSimulatedRun)
  const stopSimulatedRun = useWorkflowExecutionStore((s) => s.stopSimulatedRun)
  const [selectedStepId, setSelectedStepId] = useState<string | null>(null)
  const [isRunning, setIsRunning] = useState(false)
  const [fetchedWorkflow, setFetchedWorkflow] = useState<XmapWorkflow | null>(null)
  const [fetchError, setFetchError] = useState<string | null>(null)

  const configWorkflow = config?.workflows.find((w) => w.workflow_id === workflowId)
  const workflow = configWorkflow ?? fetchedWorkflow

  useEffect(() => {
    if (configWorkflow || !workflowId) return
    let cancelled = false
    fetchWorkflowView(workflowId).then((def) => {
      if (cancelled || !def) return
      const w = defToWorkflow(def, workflowId)
      if (w) setFetchedWorkflow(w)
      else setFetchError('Invalid workflow definition')
    }).catch((err) => {
      if (!cancelled) setFetchError(err?.message ?? 'Failed to load workflow')
    })
    return () => { cancelled = true }
  }, [workflowId, configWorkflow])

  if (!workflow && !fetchError) {
    return (
      <div className="absolute inset-0 z-30 bg-[var(--color-bg-deep)] flex flex-col items-center justify-center p-6">
        <p className="font-mono text-sm text-[var(--color-text-muted)]">Loading workflow...</p>
        <button onClick={onClose} className="mt-4 font-mono text-[10px] px-4 py-2 rounded bg-[var(--color-cyan)]20 text-[var(--color-cyan)]">Cancel</button>
      </div>
    )
  }

  if (!workflow) {
    return (
      <div className="absolute inset-0 z-30 bg-[var(--color-bg-deep)] flex flex-col items-center justify-center p-6">
        <p className="font-mono text-sm text-[var(--color-text-muted)]">
          {fetchError ?? `Workflow "${workflowId}" not found.`}
        </p>
        <button onClick={onClose} className="mt-4 font-mono text-[10px] px-4 py-2 rounded bg-[var(--color-cyan)]20 text-[var(--color-cyan)]">Close</button>
      </div>
    )
  }

  const steps = workflow.steps ?? []
  const stepIds = steps.map((s) => s.step_id)
  const stepExecutions = new Map(executions.map((e) => [e.stepId, e]))

  const workflowGates = (workflow.guardian_gates ?? [])
    .map((gId) => (config?.guardian ?? []).find((g) => g.gate_id === gId))
    .filter(Boolean) as GuardianGate[]

  const handleStartRun = () => {
    setIsRunning(true)
    startSimulatedRun(workflowId, stepIds)
  }

  const handleStopRun = () => {
    setIsRunning(false)
    stopSimulatedRun(workflowId)
  }

  return (
    <div className="absolute inset-0 z-30 bg-[var(--color-bg-deep)] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-[var(--color-bg-surface)] border-b border-[var(--color-border)]">
        <div className="flex items-center gap-3">
          <h2 className="font-mono text-sm font-semibold text-[var(--color-cyan)]">Workflow Orchestrator Live</h2>
          <code className="text-[10px] text-[var(--color-text-muted)]">{workflowId}</code>
        </div>
        <div className="flex items-center gap-2">
          {!isRunning ? (
            <button
              onClick={handleStartRun}
              className="font-mono text-[10px] px-3 py-1 rounded bg-[var(--color-cyan)]20 text-[var(--color-cyan)] hover:bg-[var(--color-cyan)]30"
            >
              Start Run
            </button>
          ) : (
            <button
              onClick={handleStopRun}
              className="font-mono text-[10px] px-3 py-1 rounded bg-[var(--color-error)]20 text-[var(--color-error)]"
            >
              Stop
            </button>
          )}
          <button onClick={onClose} className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] text-lg">
            x
          </button>
        </div>
      </div>

      {/* 3-panel layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Step DAG */}
        <div className="w-64 border-r border-[var(--color-border)] overflow-y-auto p-3">
          <h4 className="font-mono text-[10px] font-semibold text-[var(--color-text-muted)] uppercase mb-2">Step DAG</h4>
          <div className="space-y-1">
            {steps.map((step) => {
              const exec = stepExecutions.get(step.step_id)
              const status = exec?.status ?? 'pending'
              const statusColor =
                status === 'success'
                  ? 'var(--color-success)'
                  : status === 'fail'
                    ? 'var(--color-error)'
                    : status === 'running'
                      ? 'var(--color-cyan)'
                      : 'var(--color-text-muted)'
              return (
                <button
                  key={step.step_id}
                  onClick={() => setSelectedStepId(selectedStepId === step.step_id ? null : step.step_id)}
                  className={`w-full text-left p-2 rounded border transition-colors ${
                    selectedStepId === step.step_id
                      ? 'border-[var(--color-cyan)] bg-[var(--color-cyan)]10'
                      : 'border-[var(--color-border)] hover:border-[var(--color-cyan)]'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-2.5 h-2.5 rounded-full ${
                        status === 'running' ? 'animate-pulse' : ''
                      }`}
                      style={{ backgroundColor: statusColor }}
                    />
                    <span className="font-mono text-[10px] truncate">{step.step_id}</span>
                  </div>
                  {exec?.durationMs && (
                    <div className="font-mono text-[9px] text-[var(--color-text-muted)] mt-0.5">
                      {exec.durationMs}ms
                    </div>
                  )}
                </button>
              )
            })}
          </div>
          {workflowGates.length > 0 && (
            <div className="mt-4">
              <h4 className="font-mono text-[10px] font-semibold text-[var(--color-text-muted)] uppercase mb-2">
                Guardian Gates
              </h4>
              <div className="space-y-1">
                {workflowGates.map((g) => (
                  <div
                    key={g.gate_id}
                    className="flex items-center gap-2 p-1.5 rounded bg-[var(--color-bg-card)] text-[9px] font-mono"
                  >
                    <GateHex size={12} phase={g.type} />
                    {g.gate_id}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Center: Timeline */}
        <div className="flex-1 border-r border-[var(--color-border)] overflow-y-auto p-3 min-w-0">
          <h4 className="font-mono text-[10px] font-semibold text-[var(--color-text-muted)] uppercase mb-2">
            Execution Timeline
          </h4>
          {executions.length > 0 ? (
            <div className="space-y-1">
              {executions
                .filter((e) => e.startedAt || e.completedAt)
                .map((e) => (
                  <div
                    key={e.stepId}
                    className="flex items-center gap-2 p-2 rounded bg-[var(--color-bg-card)] text-[10px] font-mono"
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${
                        e.status === 'running' ? 'animate-pulse' : ''
                      }`}
                      style={{
                        backgroundColor:
                          e.status === 'success'
                            ? 'var(--color-success)'
                            : e.status === 'fail'
                              ? 'var(--color-error)'
                              : 'var(--color-cyan)',
                      }}
                    />
                    <span className="text-[var(--color-text-secondary)]">{e.stepId}</span>
                    <span className="text-[var(--color-text-muted)]">
                      {e.startedAt ? new Date(e.startedAt).toLocaleTimeString() : '-'}
                    </span>
                    {e.durationMs && (
                      <span className="text-[var(--color-cyan)]">{e.durationMs}ms</span>
                    )}
                    {e.error && (
                      <span className="text-[var(--color-error)]">{e.error}</span>
                    )}
                  </div>
                ))}
            </div>
          ) : (
            <p className="text-[10px] text-[var(--color-text-muted)]">Click Start Run to simulate execution.</p>
          )}
          {workflow.evidence_policy && (
            <div className="mt-4">
              <h4 className="font-mono text-[10px] font-semibold text-[var(--color-text-muted)] uppercase mb-2">
                Evidence
              </h4>
              <div className="flex flex-wrap gap-1">
                {(workflow.evidence_policy.required_artifacts ?? []).map((a) => (
                  <span
                    key={a}
                    className="px-2 py-0.5 rounded bg-[var(--color-purple)]20 text-[var(--color-purple)] text-[9px] font-mono"
                  >
                    {a}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: Step Detail + MCP Packet */}
        <div className="w-80 overflow-y-auto p-3">
          <h4 className="font-mono text-[10px] font-semibold text-[var(--color-text-muted)] uppercase mb-2">
            Step Detail
          </h4>
          {selectedStepId ? (() => {
            const step = steps.find((s) => s.step_id === selectedStepId)
            if (!step) return null
            const exec = stepExecutions.get(step.step_id)
            const request = inferMcpRequest(step)
            const response = exec
              ? {
                  success: exec.status === 'success',
                  error: exec.error,
                  code: exec.status === 'fail' ? 429 : undefined,
                }
              : undefined
            return (
              <McpPacketViewer
                request={request}
                response={response ?? undefined}
                durationMs={exec?.durationMs}
                stepId={step.step_id}
              />
            )
          })() : (
            <p className="text-[10px] text-[var(--color-text-muted)]">Select a step.</p>
          )}
        </div>
      </div>
    </div>
  )
}

function GateHex({ size, phase }: { size: number; phase: string }) {
  const color =
    phase === 'pre-commit'
      ? 'var(--color-cyan)'
      : phase === 'pre-deploy'
        ? 'var(--color-amber)'
        : 'var(--color-success)'
  const s = size / 2
  const points = Array.from({ length: 6 }, (_, i) => {
    const angle = (Math.PI / 3) * i - Math.PI / 6
    return `${s + s * Math.cos(angle)},${s + s * Math.sin(angle)}`
  }).join(' ')
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <polygon points={points} fill={`${color}30`} stroke={color} strokeWidth={1} />
    </svg>
  )
}
