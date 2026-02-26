/**
 * pow3r.control - X-Files Summary Widget
 *
 * Purpose:
 * - Summary of open X-Files bug cases
 * - Severity breakdown
 * - Click to open X-Files panel
 */
import { useXSystemStore } from '../../store/x-system-store'
import { SEVERITY_COLORS } from '../../lib/x-system-types'

export function XFilesSummaryWidget() {
  const cases = useXSystemStore((s) => s.xfilesCases)
  const toggleXFilesPanel = useXSystemStore((s) => s.toggleXFilesPanel)

  const open = cases.filter((c) => c.status === 'open')
  const investigating = cases.filter((c) => c.status === 'investigating')
  const resolved = cases.filter((c) => c.status === 'resolved')

  return (
    <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-lg p-4 w-full max-w-[520px]">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-mono text-[10px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">
          X-Files Cases
        </h3>
        <button
          onClick={toggleXFilesPanel}
          className="font-mono text-[9px] text-[var(--color-cyan)] hover:underline"
        >
          View all
        </button>
      </div>

      {/* Status counts */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        <StatusCard label="Open" count={open.length} color="var(--color-error)" />
        <StatusCard label="Investigating" count={investigating.length} color="var(--color-amber)" />
        <StatusCard label="Resolved" count={resolved.length} color="var(--color-success)" />
      </div>

      {/* Recent cases */}
      {cases.slice(0, 3).map((xcase) => (
        <div
          key={xcase.id}
          className="flex items-center gap-2 py-1.5 border-t border-[var(--color-border)]"
        >
          <div
            className="w-2 h-2 rounded-full shrink-0"
            style={{ backgroundColor: SEVERITY_COLORS[xcase.severity] }}
          />
          <span className="font-mono text-[10px] text-[var(--color-text-primary)] truncate flex-1">
            {xcase.title}
          </span>
          <span
            className="font-mono text-[8px] px-1 rounded"
            style={{
              color: xcase.status === 'open' ? 'var(--color-error)' : 'var(--color-amber)',
              backgroundColor: xcase.status === 'open' ? '#FF3D0015' : '#FFB30015',
            }}
          >
            {xcase.status}
          </span>
        </div>
      ))}
    </div>
  )
}

function StatusCard({ label, count, color }: { label: string; count: number; color: string }) {
  return (
    <div className="bg-[var(--color-bg-panel)] rounded p-2 text-center">
      <div className="font-mono text-xl font-bold" style={{ color }}>{count}</div>
      <div className="font-mono text-[8px] text-[var(--color-text-muted)]">{label}</div>
    </div>
  )
}
