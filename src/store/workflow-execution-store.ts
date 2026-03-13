/**
 * pow3r.control - Workflow Execution Store
 *
 * Purpose:
 * - Tracks step states for live workflow execution via SSE stream
 * - Runs workflows through /api/workflow-library/run
 * - Subscribes to /api/workflow/stream/:executionId for real-time updates
 * - Loads recent executions from /api/workflow/executions
 */
import { create } from 'zustand'
import { api, subscribeSSE } from '../lib/api-client'

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

export interface WorkflowExecution {
  executionId: string
  workflowId: string
  status: string
  startedAt?: string
  completedAt?: string
  failedAt?: string
  duration?: number
  stepsCompleted?: number
  stepCount?: number
  error?: string
  description?: string
}

interface WorkflowExecutionState {
  executions: Record<string, StepExecution[]>
  recentExecutions: WorkflowExecution[]
  activeExecutionId: string | null
  focusedWorkflowId: string | null
  runLoading: boolean
  runError: string | null
  _cleanupSSE: (() => void) | null

  setFocusedWorkflow: (id: string | null) => void
  updateStepFromEvent: (workflowId: string, stepId: string, status: StepStatus, extra?: Partial<StepExecution>) => void
  runWorkflow: (workflowId: string, input?: Record<string, unknown>) => Promise<string | null>
  stopRun: () => void
  fetchRecentExecutions: () => Promise<void>
}

export const useWorkflowExecutionStore = create<WorkflowExecutionState>((set, get) => ({
  executions: {},
  recentExecutions: [],
  activeExecutionId: null,
  focusedWorkflowId: null,
  runLoading: false,
  runError: null,
  _cleanupSSE: null,

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
      return { executions: { ...state.executions, [workflowId]: next } }
    })
  },

  runWorkflow: async (workflowId, input) => {
    set({ runLoading: true, runError: null })

    const res = await api.post<{ executionId?: string; status?: string }>('/api/workflow-library/run', { workflowId, input })
    if (!res.success) {
      set({ runLoading: false, runError: res.error || 'Run failed' })
      return null
    }

    const executionId = res.data?.executionId
    if (!executionId) {
      set({ runLoading: false })
      return null
    }

    set({ activeExecutionId: executionId })

    const cleanup = subscribeSSE<WorkflowExecution & { steps?: Array<{ id: string; status: string }> }>(`/api/workflow/stream/${executionId}`, {
      onEvent: (_eventType, data) => {
        if (data.steps && Array.isArray(data.steps)) {
          const mapped: StepExecution[] = data.steps.map((s) => ({
            stepId: s.id,
            status: s.status === 'completed' ? 'success' : (s.status as StepStatus),
          }))
          set((state) => ({
            executions: { ...state.executions, [workflowId]: mapped },
          }))
        }
      },
      onDone: () => {
        set({ runLoading: false, activeExecutionId: null })
        get().fetchRecentExecutions()
      },
      onError: (err) => {
        set({ runLoading: false, runError: err, activeExecutionId: null })
      },
    })

    set({ _cleanupSSE: cleanup, runLoading: false })
    return executionId
  },

  stopRun: () => {
    const { _cleanupSSE } = get()
    _cleanupSSE?.()
    set({ _cleanupSSE: null, activeExecutionId: null, runLoading: false })
  },

  fetchRecentExecutions: async () => {
    const res = await api.get<{ executions: WorkflowExecution[]; count: number }>('/api/workflow/executions?limit=25')
    if (res.success && res.data) {
      set({ recentExecutions: res.data.executions })
    }
  },
}))
