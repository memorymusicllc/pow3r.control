/**
 * pow3r.control - Guardian Dashboard Panel
 *
 * Purpose:
 * - Shows all Guardian gates with status (pass/fail/pending)
 * - Evaluation policy icons (automated/manual/mixed)
 * - Required evidence artifact slots
 * - Gate phase grouping (pre-commit, pre-deploy, post-deploy)
 *
 * Agent Instructions:
 * - Gate data comes from XMAP v7 `guardian[]` array
 * - Status is computed (simulated for now; will connect to live API)
 * - Phase grouping helps the CTO understand enforcement points
 */
import { useMemo } from 'react'
import { useControlStore } from '../../store/control-store'
import type { GuardianGate, GatePhase } from '../../lib/types'

const PHASE_ORDER: GatePhase[] = ['pre-commit', 'pre-deploy', 'post-deploy']
const PHASE_LABELS: Record<GatePhase, string> = {
  'pre-commit': 'Pre-Commit',
  'pre-deploy': 'Pre-Deploy',
  'post-deploy': 'Post-Deploy',
}

const PHASE_COLORS: Record<GatePhase, string> = {
  'pre-commit': 'var(--color-cyan)',
  'pre-deploy': 'var(--color-amber)',
  'post-deploy': 'var(--color-success)',
}

type GateStatus = 'pass' | 'fail' | 'pending'

function simulateGateStatus(gate: GuardianGate): GateStatus {
  if (gate.gate_id === 'documentationGate') return 'pending'
  if (gate.gate_id === 'behavioralTestRequiredGate') return 'pending'
  return 'pass'
}

export function GuardianDashboard() {
  const config = useControlStore((s) => s.config)
  const showGuardianDashboard = useControlStore((s) => s.showGuardianDashboard)
  const toggleGuardianDashboard = useControlStore((s) => s.toggleGuardianDashboard)

  const gates = config?.guardian ?? []

  const grouped = useMemo(() => {
    const groups: Record<GatePhase, Array<GuardianGate & { status: GateStatus }>> = {
      'pre-commit': [],
      'pre-deploy': [],
      'post-deploy': [],
    }
    gates.forEach((g) => {
      const status = simulateGateStatus(g)
      groups[g.type].push({ ...g, status })
    })
    return groups
  }, [gates])

  const totalPass = gates.filter((g) => simulateGateStatus(g) === 'pass').length
  const totalFail = gates.filter((g) => simulateGateStatus(g) === 'fail').length
  const totalPending = gates.filter((g) => simulateGateStatus(g) === 'pending').length

  if (!showGuardianDashboard) return null

  return (
    <div className="absolute top-0 left-0 w-72 h-full bg-[var(--color-bg-panel)] border-r border-[var(--color-border)] overflow-y-auto z-20">
      {/* Header */}
      <div className="sticky top-0 bg-[var(--color-bg-panel)] border-b border-[var(--color-border)] p-3 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <HexIcon size={16} color="var(--color-success)" />
            <h3 className="font-mono text-xs font-semibold">Guardian Gates</h3>
          </div>
          <button
            onClick={toggleGuardianDashboard}
            className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] text-lg leading-none"
          >
            x
          </button>
        </div>
        {/* Summary bar */}
        <div className="flex items-center gap-3 mt-2 font-mono text-[10px]">
          <span className="text-[var(--color-success)]">{totalPass} pass</span>
          {totalFail > 0 && <span className="text-[var(--color-error)]">{totalFail} fail</span>}
          {totalPending > 0 && <span className="text-[var(--color-amber)]">{totalPending} pending</span>}
          <span className="text-[var(--color-text-muted)] ml-auto">{gates.length} total</span>
        </div>
        {/* Progress bar */}
        <div className="mt-1.5 h-1.5 bg-[var(--color-bg-card)] rounded-full overflow-hidden flex">
          <div
            className="h-full bg-[var(--color-success)]"
            style={{ width: `${(totalPass / Math.max(gates.length, 1)) * 100}%` }}
          />
          <div
            className="h-full bg-[var(--color-error)]"
            style={{ width: `${(totalFail / Math.max(gates.length, 1)) * 100}%` }}
          />
          <div
            className="h-full bg-[var(--color-amber)]"
            style={{ width: `${(totalPending / Math.max(gates.length, 1)) * 100}%` }}
          />
        </div>
      </div>

      {/* Gate list by phase */}
      <div className="p-3 space-y-4">
        {PHASE_ORDER.map((phase) => {
          const phaseGates = grouped[phase]
          if (phaseGates.length === 0) return null
          return (
            <div key={phase}>
              <h4
                className="font-mono text-[10px] font-semibold uppercase tracking-wider mb-2"
                style={{ color: PHASE_COLORS[phase] }}
              >
                {PHASE_LABELS[phase]} ({phaseGates.length})
              </h4>
              <div className="space-y-1.5">
                {phaseGates.map((gate) => (
                  <GateRow key={gate.gate_id} gate={gate} status={gate.status} />
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function GateRow({ gate, status }: { gate: GuardianGate; status: GateStatus }) {
  const statusColor = status === 'pass'
    ? 'var(--color-success)'
    : status === 'fail'
      ? 'var(--color-error)'
      : 'var(--color-amber)'

  const statusIcon = status === 'pass' ? 'P' : status === 'fail' ? 'X' : '?'

  const policyIcon = gate.evaluation_policy === 'automated' ? 'A'
    : gate.evaluation_policy === 'manual' ? 'M'
    : 'H'

  return (
    <div className="flex items-start gap-2 p-1.5 rounded bg-[var(--color-bg-card)] border border-[var(--color-border)]">
      {/* Status hex */}
      <div className="shrink-0 mt-0.5">
        <HexIcon size={20} color={statusColor} label={statusIcon} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1">
          <span className="font-mono text-[10px] text-[var(--color-text-primary)] truncate">
            {formatGateName(gate.gate_id)}
          </span>
          <span
            className="shrink-0 font-mono text-[8px] px-1 rounded"
            style={{
              color: 'var(--color-bg-deep)',
              backgroundColor:
                gate.evaluation_policy === 'automated' ? 'var(--color-cyan)' :
                gate.evaluation_policy === 'manual' ? 'var(--color-magenta)' :
                'var(--color-purple)',
            }}
          >
            {policyIcon}
          </span>
        </div>

        {/* Evidence slots */}
        {gate.required_evidence && gate.required_evidence.length > 0 && (
          <div className="flex gap-1 mt-1">
            {gate.required_evidence.map((ev) => (
              <span
                key={ev}
                className="px-1 py-0.5 text-[8px] font-mono rounded border"
                style={{
                  borderColor: status === 'pass' ? 'var(--color-success)' : 'var(--color-border)',
                  color: status === 'pass' ? 'var(--color-success)' : 'var(--color-text-muted)',
                }}
              >
                {ev}
              </span>
            ))}
          </div>
        )}

        {/* Action on fail */}
        <div className="mt-0.5 font-mono text-[8px] text-[var(--color-text-muted)]">
          on fail: <span style={{ color: gate.action_on_fail === 'block' ? 'var(--color-error)' : 'var(--color-amber)' }}>
            {gate.action_on_fail}
          </span>
        </div>
      </div>
    </div>
  )
}

function HexIcon({ size, color, label }: { size: number; color: string; label?: string }) {
  const s = size / 2
  const points = Array.from({ length: 6 }, (_, i) => {
    const angle = (Math.PI / 3) * i - Math.PI / 6
    return `${s + s * Math.cos(angle)},${s + s * Math.sin(angle)}`
  }).join(' ')

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <polygon
        points={points}
        fill={`${color}20`}
        stroke={color}
        strokeWidth={1.5}
      />
      {label && (
        <text
          x={s}
          y={s}
          textAnchor="middle"
          dominantBaseline="central"
          fill={color}
          fontSize={size * 0.35}
          fontFamily="monospace"
          fontWeight={700}
        >
          {label}
        </text>
      )}
    </svg>
  )
}

function formatGateName(gateId: string): string {
  return gateId
    .replace(/Gate$/, '')
    .replace(/([A-Z])/g, ' $1')
    .trim()
}
