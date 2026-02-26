/**
 * pow3r.control - X-Files Case Panel
 *
 * Purpose:
 * - Shows open X-Files bug cases with severity indicators
 * - Links cases to affected nodes in the graph
 * - Status tracking: open -> investigating -> resolved -> closed
 */
import { useXSystemStore } from '../../store/x-system-store'
import { SEVERITY_COLORS } from '../../lib/x-system-types'
import { useControlStore } from '../../store/control-store'

export function XFilesPanel() {
  const showPanel = useXSystemStore((s) => s.showXFilesPanel)
  const togglePanel = useXSystemStore((s) => s.toggleXFilesPanel)
  const cases = useXSystemStore((s) => s.xfilesCases)
  const selectNode = useControlStore((s) => s.selectNode)

  if (!showPanel) return null

  const openCases = cases.filter((c) => c.status !== 'closed')

  return (
    <div className="absolute top-0 left-0 w-72 h-full bg-[var(--color-bg-panel)] border-r border-[var(--color-border)] overflow-y-auto z-20">
      <div className="sticky top-0 bg-[var(--color-bg-panel)] border-b border-[var(--color-border)] p-3 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[var(--color-error)]">!</span>
            <h3 className="font-mono text-xs font-semibold">X-Files Cases</h3>
          </div>
          <button
            onClick={togglePanel}
            className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] text-lg leading-none"
          >
            x
          </button>
        </div>
        <div className="flex items-center gap-2 mt-1.5 font-mono text-[10px]">
          <span className="text-[var(--color-error)]">{openCases.length} open</span>
          <span className="text-[var(--color-text-muted)]">{cases.length} total</span>
        </div>
      </div>

      <div className="p-3 space-y-2">
        {openCases.length === 0 ? (
          <div className="text-center py-8">
            <span className="font-mono text-[10px] text-[var(--color-text-muted)]">
              No open cases
            </span>
          </div>
        ) : (
          openCases.map((xcase) => (
            <button
              key={xcase.id}
              onClick={() => selectNode(xcase.nodeId)}
              className="block w-full text-left p-2 rounded bg-[var(--color-bg-card)] border border-[var(--color-border)] hover:border-[var(--color-error)] transition-colors"
            >
              <div className="flex items-start gap-2">
                <div
                  className="w-2 h-2 rounded-full mt-1 shrink-0"
                  style={{ backgroundColor: SEVERITY_COLORS[xcase.severity] }}
                />
                <div className="flex-1 min-w-0">
                  <div className="font-mono text-[10px] font-semibold text-[var(--color-text-primary)]">
                    {xcase.title}
                  </div>
                  <div className="font-mono text-[9px] text-[var(--color-text-secondary)] mt-0.5 line-clamp-2">
                    {xcase.description}
                  </div>
                  <div className="flex items-center gap-2 mt-1 font-mono text-[8px]">
                    <span className="text-[var(--color-cyan)]">{xcase.nodeId}</span>
                    <span
                      className="px-1 rounded"
                      style={{
                        color: xcase.status === 'open' ? 'var(--color-error)'
                          : xcase.status === 'investigating' ? 'var(--color-amber)'
                          : 'var(--color-success)',
                        backgroundColor: xcase.status === 'open' ? '#FF3D0015'
                          : xcase.status === 'investigating' ? '#FFB30015'
                          : '#00E67615',
                      }}
                    >
                      {xcase.status}
                    </span>
                    <span className="text-[var(--color-text-muted)]">{xcase.severity}</span>
                  </div>
                </div>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  )
}
