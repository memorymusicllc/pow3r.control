/**
 * pow3r.control - Agent Management
 *
 * Purpose:
 * - Workforce roster, psychology Big Five radar, team viewer
 * - Personality adjustment sliders, task queue
 */
import { useState } from 'react'

const DEMO_AGENTS = [
  { id: 'abi', name: 'Abi', template: 'director', status: 'active', workload: 3 },
  { id: 'maxi', name: 'Maxi', template: 'architect', status: 'idle', workload: 0 },
]

export function AgentManagement() {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [bigFive, setBigFive] = useState({ O: 70, C: 65, E: 50, A: 60, N: 30 })

  return (
    <div className="p-4 flex gap-4">
      <div className="w-64 space-y-2">
        <h4 className="font-mono text-[10px] font-semibold text-[var(--color-text-muted)] uppercase">Roster</h4>
        {DEMO_AGENTS.map((a) => (
          <button
            key={a.id}
            onClick={() => setSelectedId(a.id)}
            className={`w-full text-left p-2 rounded border ${
              selectedId === a.id ? 'border-[var(--color-cyan)] bg-[var(--color-cyan)]10' : 'border-[var(--color-border)]'
            }`}
          >
            <div className="font-mono text-[10px]">{a.name}</div>
            <div className="font-mono text-[9px] text-[var(--color-text-muted)]">{a.template} | {a.status}</div>
          </button>
        ))}
      </div>
      <div className="flex-1 space-y-4">
        <h4 className="font-mono text-[10px] font-semibold text-[var(--color-text-muted)] uppercase">Psychology Lab</h4>
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
        <h4 className="font-mono text-[10px] font-semibold text-[var(--color-text-muted)] uppercase">Task Queue</h4>
        <div className="p-2 rounded border border-[var(--color-border)] font-mono text-[10px] text-[var(--color-text-muted)]">
          No active delegated tasks
        </div>
      </div>
    </div>
  )
}
