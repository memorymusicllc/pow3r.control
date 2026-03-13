/**
 * pow3r.control - Guardian Gate Status Store
 *
 * Purpose:
 * - Fetches real Guardian gate evaluations from /api/guardian/status
 * - Polls every 30s for live status updates
 * - Replaces simulated gate status in GuardianDashboard and GuardianSummaryWidget
 *
 * Agent Instructions:
 * - Use useGuardianStore() hook in components
 * - Call fetchGates() to refresh, or startPolling()/stopPolling() for live updates
 */
import { create } from 'zustand'
import { api } from '../lib/api-client'

export interface GateStatus {
  gateId: string
  name: string
  category: string
  status: 'pass' | 'fail' | 'pending'
  score: number
  errors: Array<{ path?: string; message: string; rule?: string }>
  warnings: Array<{ path?: string; message: string; rule?: string }>
  lastChecked: string | null
}

interface GuardianState {
  gates: GateStatus[]
  summary: { total: number; passed: number; failed: number; pending: number }
  overallStatus: 'clear' | 'blocked' | 'pending' | 'unknown'
  loading: boolean
  error: string | null
  lastFetched: string | null

  fetchGates: () => Promise<void>
  startPolling: () => void
  stopPolling: () => void
  _pollInterval: ReturnType<typeof setInterval> | null
}

export const useGuardianStore = create<GuardianState>((set, get) => ({
  gates: [],
  summary: { total: 0, passed: 0, failed: 0, pending: 0 },
  overallStatus: 'unknown',
  loading: false,
  error: null,
  lastFetched: null,
  _pollInterval: null,

  fetchGates: async () => {
    set({ loading: true, error: null })
    const res = await api.get<{
      gates: GateStatus[]
      summary: { total: number; passed: number; failed: number; pending: number }
      overallStatus: string
    }>('/api/guardian/status')

    if (res.success && res.data) {
      set({
        gates: res.data.gates,
        summary: res.data.summary,
        overallStatus: (res.data.overallStatus as GuardianState['overallStatus']) || 'unknown',
        loading: false,
        lastFetched: new Date().toISOString(),
      })
    } else {
      set({ loading: false, error: res.error || 'Failed to fetch gates' })
    }
  },

  startPolling: () => {
    const s = get()
    if (s._pollInterval) return
    s.fetchGates()
    const interval = setInterval(() => get().fetchGates(), 30000)
    set({ _pollInterval: interval })
  },

  stopPolling: () => {
    const s = get()
    if (s._pollInterval) {
      clearInterval(s._pollInterval)
      set({ _pollInterval: null })
    }
  },
}))
