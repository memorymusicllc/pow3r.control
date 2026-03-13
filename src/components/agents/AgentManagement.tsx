/**
 * pow3r.control - Agent Management
 *
 * Purpose:
 * - Workforce roster from /api/agents/roster (live data)
 * - Personality adjustment sliders, task queue
 */
import { useState, useEffect } from 'react'
import { useAgentStore } from '../../store/agent-store'

export function AgentManagement() {
  const agents = useAgentStore((s) => s.agents)
  const loading = useAgentStore((s) => s.loading)
  const error = useAgentStore((s) => s.error)
  const fetchAgents = useAgentStore((s) => s.fetchAgents)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [bigFive, setBigFive] = useState({ O: 70, C: 65, E: 50, A: 60, N: 30 })

  useEffect(() => { fetchAgents() }, [fetchAgents])

  return (
    <div className="px-5 py-4 flex gap-5">
      <div className="w-64 space-y-2">
        <h4 className="font-mono text-[10px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">
          Roster {agents.length > 0 && `(${agents.length})`}
        </h4>
        {loading && <div className="font-mono text-[9px] text-[var(--color-text-muted)]">Loading agents...</div>}
        {error && <div className="font-mono text-[9px] text-[var(--color-error)]">{error}</div>}
        {agents.map((a) => (
          <button
            key={a.agentId}
            onClick={() => setSelectedId(a.agentId)}
            className={`w-full text-left p-2 rounded border ${
              selectedId === a.agentId ? 'border-[var(--color-cyan)] bg-[var(--color-cyan)]10' : 'border-[var(--color-border)]'
            }`}
          >
            <div className="font-mono text-[10px]">{a.name || a.agentId}</div>
            <div className="font-mono text-[9px] text-[var(--color-text-muted)]">
              {a.template} | {a.status}
              {a.workload.activeTasks > 0 && ` | ${a.workload.activeTasks} active`}
            </div>
          </button>
        ))}
        {!loading && agents.length === 0 && !error && (
          <div className="font-mono text-[9px] text-[var(--color-text-muted)]">No agents registered</div>
        )}
      </div>
      <div className="flex-1 space-y-4">
        <h4 className="font-mono text-[10px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">Psychology Lab</h4>
        <div className="flex gap-4 flex-wrap">
          {(['O', 'C', 'E', 'A', 'N'] as const).map((trait) => (
            <div key={trait} className="w-24">
              <label className="font-mono text-[9px] text-[var(--color-text-muted)]">{trait}</label>
              <input
                type="range"
                min={0}
                max={100}
                value={bigFive[trait]}
                onChange={(e) => setBigFive((p) => ({ ...p, [trait]: Number(e.target.value) }))}
                className="w-full"
              />
              <span className="font-mono text-[9px]">{bigFive[trait]}</span>
            </div>
          ))}
        </div>
        <h4 className="font-mono text-[10px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">Task Queue</h4>
        <div className="px-4 py-3 rounded border border-[var(--color-border)] font-mono text-[10px] text-[var(--color-text-muted)]">
          {selectedId ? `Tasks for ${selectedId}` : 'Select an agent to view tasks'}
        </div>
      </div>
    </div>
  )
}
