/**
 * pow3r.control - Agent Roster Store
 *
 * Purpose:
 * - Fetches real agent roster from /api/agents/roster
 * - Replaces DEMO_AGENTS in AgentManagement
 *
 * Agent Instructions:
 * - Use useAgentStore() hook in components
 * - Call fetchAgents() to load roster
 */
import { create } from 'zustand'
import { api } from '../lib/api-client'

export interface Agent {
  agentId: string
  name: string
  template: string
  status: string
  workload: { activeTasks: number; pendingTasks: number; load: number }
  persona: Record<string, unknown> | null
  capabilities: { mcpServers?: string[]; tools?: string[] } | null
}

interface AgentState {
  agents: Agent[]
  loading: boolean
  error: string | null

  fetchAgents: () => Promise<void>
}

export const useAgentStore = create<AgentState>((set) => ({
  agents: [],
  loading: false,
  error: null,

  fetchAgents: async () => {
    set({ loading: true, error: null })
    const res = await api.get<{ agents: Agent[]; count: number }>('/api/agents/roster')

    if (res.success && res.data) {
      set({ agents: res.data.agents, loading: false })
    } else {
      set({ loading: false, error: res.error || 'Failed to fetch agents' })
    }
  },
}))
