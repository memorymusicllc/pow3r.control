/**
 * pow3r.control - Expanded Node View
 *
 * Purpose:
 * - Renders sub-graph content when a node is expanded
 * - Workflows, sub-nodes (connected), MCP tools, X-System events
 * - Recursive drill-down: click workflow to expand, click sub-node to expand
 */
import { useNodeExpansion } from '../../context/NodeExpansionContext'
import { useControlStore } from '../../store/control-store'
import { NODE_TYPE_COLORS, STATUS_COLORS } from '../../lib/types'
import type { XmapNode } from '../../lib/types'
import type { XStreamEvent } from '../../lib/x-system-types'

export function ExpandedNodeView() {
  const { currentExpandedId, expansionData, expansionStack, clearExpansion, pushExpansion, popExpansion } = useNodeExpansion()
  const config = useControlStore((s) => s.config)
  const expandWorkflow = useControlStore((s) => s.expandWorkflow)

  if (!config || !currentExpandedId) return null

  const node = config.nodes.find((n) => n.node_id === currentExpandedId)
  if (!node) return null

  const typeColor = NODE_TYPE_COLORS[node.node_type] ?? '#888'

  return (
    <div className="absolute top-0 left-0 w-96 max-w-[90vw] h-full bg-[var(--color-bg-panel)] border-r border-[var(--color-border)] overflow-y-auto z-25 shadow-xl">
      {/* Header */}
      <div className="sticky top-0 bg-[var(--color-bg-panel)] border-b border-[var(--color-border)] p-3 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: typeColor }}
            />
            <span className="font-mono text-xs text-[var(--color-text-secondary)]">
              {node.node_type}
            </span>
          </div>
          <div className="flex items-center gap-1">
            {expansionStack.length > 1 && (
              <button
                onClick={popExpansion}
                className="font-mono text-[9px] px-2 py-0.5 text-[var(--color-cyan)] hover:bg-[var(--color-bg-card)] rounded"
              >
                back
              </button>
            )}
            <button
              onClick={clearExpansion}
              className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] text-lg leading-none"
            >
              x
            </button>
          </div>
        </div>
        <h3 className="font-mono text-sm font-semibold mt-1">{node.name}</h3>
        <code className="text-[10px] text-[var(--color-text-muted)]">{node.node_id}</code>
      </div>

      <div className="p-3 space-y-4">
        {/* Workflows */}
        {expansionData && expansionData.workflows.length > 0 && (
          <Section title={`Workflows (${expansionData.workflows.length})`}>
            <div className="space-y-1.5">
              {expansionData.workflows.map((wf) => (
                <button
                  key={wf.workflow_id}
                  onClick={() => expandWorkflow(wf.workflow_id)}
                  className="block w-full text-left p-2 rounded bg-[var(--color-bg-card)] border border-[var(--color-border)] hover:border-[var(--color-cyan)] transition-colors"
                >
                  <span className="font-mono text-[10px] text-[var(--color-cyan)]">
                    {wf.workflow_id}
                  </span>
                  <span className="ml-2 px-1 py-0.5 text-[8px] font-mono rounded bg-[var(--color-bg-surface)] text-[var(--color-text-muted)]">
                    {wf.workflow_type}
                  </span>
                </button>
              ))}
            </div>
          </Section>
        )}

        {/* Sub-nodes (connected via edges) */}
        {expansionData && expansionData.subNodes.length > 0 && (
          <Section title={`Connected Nodes (${expansionData.subNodes.length})`}>
            <div className="space-y-1.5">
              {expansionData.subNodes.map((n) => (
                <SubNodeRow
                  key={n.node_id}
                  node={n}
                  onClick={() => pushExpansion(n.node_id)}
                />
              ))}
            </div>
          </Section>
        )}

        {/* MCP Tools */}
        {expansionData && expansionData.mcpTools.length > 0 && (
          <Section title={`MCP Tools (${expansionData.mcpTools.length})`}>
            <div className="space-y-1 max-h-40 overflow-y-auto">
              {expansionData.mcpTools.slice(0, 20).map((t, i) => (
                <div
                  key={`${t.server}-${t.toolName}-${i}`}
                  className="font-mono text-[9px] text-[var(--color-text-secondary)] truncate"
                >
                  <span className="text-[var(--color-purple)]">{t.server}</span>
                  <span className="text-[var(--color-text-muted)]">.</span>
                  <span className="text-[var(--color-cyan)]">{t.toolName}</span>
                </div>
              ))}
              {expansionData.mcpTools.length > 20 && (
                <div className="text-[9px] text-[var(--color-text-muted)]">
                  +{expansionData.mcpTools.length - 20} more
                </div>
              )}
            </div>
          </Section>
        )}

        {/* X-System Events */}
        {expansionData && expansionData.events.length > 0 && (
          <Section title={`Recent Events (${expansionData.events.length})`}>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {expansionData.events.slice(-10).reverse().map((e, i) => (
                <EventRow key={`${e.timestamp}-${i}`} event={e} />
              ))}
            </div>
          </Section>
        )}

        {expansionData &&
          expansionData.workflows.length === 0 &&
          expansionData.subNodes.length === 0 &&
          expansionData.mcpTools.length === 0 &&
          expansionData.events.length === 0 && (
            <Section title="No expansion data">
              <p className="text-xs text-[var(--color-text-muted)]">
                No workflows, connected nodes, MCP tools, or events for this node.
              </p>
            </Section>
          )}
      </div>
    </div>
  )
}

function SubNodeRow({ node, onClick }: { node: XmapNode; onClick: () => void }) {
  const typeColor = NODE_TYPE_COLORS[node.node_type] ?? '#888'
  const statusColor = STATUS_COLORS[node.status] ?? '#555'
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 w-full text-left p-2 rounded bg-[var(--color-bg-card)] border border-[var(--color-border)] hover:border-[var(--color-cyan)] transition-colors"
    >
      <div
        className="w-2 h-2 rounded-full shrink-0"
        style={{ backgroundColor: typeColor }}
      />
      <div className="flex-1 min-w-0">
        <span className="font-mono text-[10px] text-[var(--color-text-primary)] truncate block">
          {node.name}
        </span>
        <span className="font-mono text-[8px] text-[var(--color-text-muted)]">
          {node.node_id}
        </span>
      </div>
      <div
        className="w-2 h-2 rounded-full shrink-0"
        style={{ backgroundColor: statusColor }}
        title={node.status}
      />
    </button>
  )
}

function EventRow({ event }: { event: XStreamEvent }) {
  const sev = event.severity ?? 'info'
  const color =
    sev === 'critical' || sev === 'high'
      ? 'var(--color-error)'
      : sev === 'medium'
        ? 'var(--color-amber)'
        : 'var(--color-cyan)'
  return (
    <div className="font-mono text-[9px] py-0.5 border-b border-[var(--color-border)] last:border-0">
      <span className="text-[var(--color-text-muted)]">
        {new Date(event.timestamp).toLocaleTimeString()}
      </span>
      <span className="mx-1" style={{ color }}>
        {sev}
      </span>
      <span className="text-[var(--color-text-secondary)] truncate block">
        {event.message ?? JSON.stringify(event.data ?? {})}
      </span>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h4 className="font-mono text-[10px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-1.5">
        {title}
      </h4>
      {children}
    </div>
  )
}
