/**
 * pow3r.control - Workflow Execution Store
 *
 * Purpose:
 * - Tracks step states for live workflow execution
 * - Integrates with X-System events filtered by workflowId
 * - Supports simulated execution for demo
 */
import { create } from 'zustand'

export type StepStatus = 'pending' | 'running' | 'success' | 'fail'

export interface StepExecution {
  stepId: string
  status: StepStatus
  startedAt?: string
  completedAt?: string
  durationMs?: number
  error?: string
  retryCount?: number
}

interface WorkflowExecutionState {
  executions: Record<string, StepExecution[]>
  focusedWorkflowId: string | null
  setFocusedWorkflow: (id: string | null) => void
  updateStepFromEvent: (workflowId: string, stepId: string, status: StepStatus, extra?: Partial<StepExecution>) => void
  startSimulatedRun: (workflowId: string, stepIds: string[]) => void
  stopSimulatedRun: (workflowId: string) => void
}

export const useWorkflowExecutionStore = create<WorkflowExecutionState>((set) => ({
  executions: {},
  focusedWorkflowId: null,

  setFocusedWorkflow: (id) => set({ focusedWorkflowId: id }),

  updateStepFromEvent: (workflowId, stepId, status, extra) => {
    set((state) => {
      const steps = state.executions[workflowId] ?? []
      const idx = steps.findIndex((s) => s.stepId === stepId)
      const next = [...steps]
      if (idx >= 0) {
        next[idx] = { ...next[idx], status, ...extra }
      } else {
        next.push({ stepId, status, ...extra })
      }
      return {
        executions: { ...state.executions, [workflowId]: next },
      }
    })
  },

  startSimulatedRun: (workflowId, stepIds) => {
    const initial: StepExecution[] = stepIds.map((id) => ({ stepId: id, status: 'pending' as StepStatus }))
    set((s) => ({
      executions: { ...s.executions, [workflowId]: initial },
    }))

    let i = 0
    const advance = () => {
      if (i >= stepIds.length) return
      const stepId = stepIds[i]
      set((s) => {
        const steps = [...(s.executions[workflowId] ?? [])]
        const idx = steps.findIndex((x) => x.stepId === stepId)
        if (idx >= 0) {
          steps[idx] = {
            ...steps[idx],
            status: 'running',
            startedAt: new Date().toISOString(),
          }
        }
        return { executions: { ...s.executions, [workflowId]: steps } }
      })
      const durationMs = 800 + Math.floor(Math.random() * 1200)
      setTimeout(() => {
        set((s) => {
          const steps = [...(s.executions[workflowId] ?? [])]
          const idx = steps.findIndex((x) => x.stepId === stepId)
          const fail = Math.random() < 0.12 && i > 0
          if (idx >= 0) {
            steps[idx] = {
              ...steps[idx],
              status: fail ? 'fail' : 'success',
              completedAt: new Date().toISOString(),
              durationMs,
              error: fail ? 'RATE_LIMIT_EXCEEDED' : undefined,
            }
          }
          return { executions: { ...s.executions, [workflowId]: steps } }
        })
        i++
        setTimeout(advance, 400)
      }, durationMs)
    }
    setTimeout(advance, 500)
  },

  stopSimulatedRun: (workflowId) => {
    set((s) => ({
      executions: { ...s.executions, [workflowId]: [] },
    }))
  },
}))
