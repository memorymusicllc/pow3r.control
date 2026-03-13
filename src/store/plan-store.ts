/**
 * pow3r.control - Plan Memory Store
 *
 * Purpose:
 * - Fetches plan memory data from /api/plan-memory/list
 * - Provides current plan, tasks remaining, plan count
 *
 * Agent Instructions:
 * - Use usePlanStore() hook in components
 * - Call fetchPlans() to load plan memory
 */
import { create } from 'zustand'
import { api } from '../lib/api-client'

export interface PlanSummary {
  id: string
  name: string
  implementationLevel: number
  status?: string
  built?: boolean
  todosTotal?: number
  todosCompleted?: number
}

interface PlanState {
  plans: PlanSummary[]
  inProgress: PlanSummary | null
  totalPlans: number
  incompletePlans: number
  loading: boolean
  error: string | null

  fetchPlans: () => Promise<void>
}

export const usePlanStore = create<PlanState>((set) => ({
  plans: [],
  inProgress: null,
  totalPlans: 0,
  incompletePlans: 0,
  loading: false,
  error: null,

  fetchPlans: async () => {
    set({ loading: true, error: null })
    const res = await api.get<{ plans: PlanSummary[]; inProgress?: PlanSummary }>('/api/plan-memory/list')

    if (res.success && res.data) {
      const plans = res.data.plans || []
      set({
        plans,
        inProgress: res.data.inProgress || null,
        totalPlans: plans.length,
        incompletePlans: plans.filter((p) => (p.implementationLevel ?? 0) < 100).length,
        loading: false,
      })
    } else {
      set({ loading: false, error: res.error || 'Failed to fetch plans' })
    }
  },
}))
