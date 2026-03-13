/**
 * pow3r.control - Guardian Dashboard Panel
 *
 * Purpose:
 * - Shows all Guardian gates with real status from /api/guardian/status
 * - Grouped by category
 * - Live-updating via guardian-store polling
 *
 * Agent Instructions:
 * - Gate data comes from useGuardianStore (real API)
 * - XMAP guardian array used only as fallback structure
 */
import { useEffect, useMemo } from 'react'
import { useControlStore } from '../../store/control-store'
import { useGuardianStore } from '../../store/guardian-store'
import type { GatePhase } from '../../lib/types'

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

const CATEGORY_TO_PHASE: Record<string, GatePhase> = {
  'pre-deploy': 'pre-deploy',
  'deployment': 'pre-deploy',
  'testing': 'pre-commit',
  'evidence': 'pre-deploy',
  'planning': 'pre-commit',
  'observability': 'pre-deploy',
  'documentation': 'pre-commit',
  'configuration': 'pre-deploy',
  'monitoring': 'post-deploy',
  'intelligence': 'post-deploy',
  'verification': 'post-deploy',
  'reliability': 'post-deploy',
  'lifecycle': 'post-deploy',
  'compliance': 'pre-commit',
  'post-deploy': 'post-deploy',
}

type GateStatus = 'pass' | 'fail' | 'pending'

export function GuardianDashboard() {
  const showGuardianDashboard = useControlStore((s) => s.showGuardianDashboard)
  const toggleGuardianDashboard = useControlStore((s) => s.toggleGuardianDashboard)
  const apiGates = useGuardianStore((s) => s.gates)
  const summary = useGuardianStore((s) => s.summary)
  const startPolling = useGuardianStore((s) => s.startPolling)
  const stopPolling = useGuardianStore((s) => s.stopPolling)

  useEffect(() => {
    if (showGuardianDashboard) { startPolling() }
    return () => stopPolling()
  }, [showGuardianDashboard, startPolling, stopPolling])

  const grouped = useMemo(() => {
    const groups: Record<GatePhase, Array<{ gate_id: string; name: string; status: GateStatus; category: string; errors: unknown[]; warnings: unknown[] }>> = {
      'pre-commit': [],
      'pre-deploy': [],
      'post-deploy': [],
    }
    for (const g of apiGates) {
      const phase = CATEGORY_TO_PHASE[g.category] || 'post-deploy'
      groups[phase].push({ gate_id: g.gateId, name: g.name, status: g.status, category: g.category, errors: g.errors, warnings: g.warnings })
    }
    return groups
  }, [apiGates])

  const totalPass = summary.passed
  const totalFail = summary.failed
  const totalPending = summary.pending
  const totalGates = summary.total || apiGates.length

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
          <span className="text-[var(--color-text-muted)] ml-auto">{totalGates} total</span>
        </div>
        {/* Progress bar */}
        <div className="mt-1.5 h-1.5 bg-[var(--color-bg-card)] rounded-full overflow-hidden flex">
          <div
            className="h-full bg-[var(--color-success)]"
            style={{ width: `${(totalPass / Math.max(totalGates, 1)) * 100}%` }}
          />
          <div
            className="h-full bg-[var(--color-error)]"
            style={{ width: `${(totalFail / Math.max(totalGates, 1)) * 100}%` }}
          />
          <div
            className="h-full bg-[var(--color-amber)]"
            style={{ width: `${(totalPending / Math.max(totalGates, 1)) * 100}%` }}
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
                  <GateRowLive key={gate.gate_id} gate={gate} />
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function GateRowLive({ gate }: { gate: { gate_id: string; name: string; status: GateStatus; category: string; errors: unknown[]; warnings: unknown[] } }) {
  const statusColor = gate.status === 'pass'
    ? 'var(--color-success)'
    : gate.status === 'fail'
      ? 'var(--color-error)'
      : 'var(--color-amber)'

  const statusIcon = gate.status === 'pass' ? 'P' : gate.status === 'fail' ? 'X' : '?'

  return (
    <div className="flex items-start gap-2 p-1.5 rounded bg-[var(--color-bg-card)] border border-[var(--color-border)]">
      <div className="shrink-0 mt-0.5">
        <HexIcon size={20} color={statusColor} label={statusIcon} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1">
          <span className="font-mono text-[10px] text-[var(--color-text-primary)] truncate">
            {gate.name}
          </span>
          <span className="shrink-0 font-mono text-[8px] px-1 rounded" style={{ color: 'var(--color-bg-deep)', backgroundColor: 'var(--color-cyan)' }}>
            {gate.category}
          </span>
        </div>

        {gate.errors.length > 0 && (
          <div className="mt-0.5 font-mono text-[8px] text-[var(--color-error)]">
            {(gate.errors[0] as { message?: string })?.message || 'Error'}
          </div>
        )}
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

