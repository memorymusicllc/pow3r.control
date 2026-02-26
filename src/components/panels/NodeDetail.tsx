/**
 * pow3r.control - Node Detail Panel
 *
 * Purpose:
 * - Shows all metadata for a selected XMAP v7 node
 * - Organized into collapsible sections: Identity, Status, Tech, Governance, Telemetry
 */
import { useControlStore, selectSelectedNode } from '../../store/control-store'
import { NODE_TYPE_COLORS, STATUS_COLORS } from '../../lib/types'

export function NodeDetail() {
  const node = useControlStore(selectSelectedNode)
  const selectNode = useControlStore((s) => s.selectNode)

  if (!node) return null

  const typeColor = NODE_TYPE_COLORS[node.node_type] ?? '#888'
  const statusColor = STATUS_COLORS[node.status] ?? '#555'

  return (
    <div className="absolute top-0 right-0 w-80 h-full bg-[var(--color-bg-panel)] border-l border-[var(--color-border)] overflow-y-auto z-20">
      {/* Header */}
      <div className="sticky top-0 bg-[var(--color-bg-panel)] border-b border-[var(--color-border)] p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: typeColor }} />
            <span className="font-mono text-xs text-[var(--color-text-secondary)]">
              {node.node_type}
            </span>
          </div>
          <button
            onClick={() => selectNode(null)}
            className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] text-lg leading-none"
          >
            x
          </button>
        </div>
        <h3 className="font-mono text-sm font-semibold mt-1">{node.name}</h3>
        <code className="text-[10px] text-[var(--color-text-muted)]">{node.node_id}</code>
      </div>

      <div className="p-3 space-y-4">
        {/* Status */}
        <Section title="Status">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: statusColor }} />
            <span className="font-mono text-xs capitalize">{node.status}</span>
          </div>
          {node.owner && (
            <Row label="Owner" value={node.owner} />
          )}
        </Section>

        {/* Description */}
        {node.description && (
          <Section title="Description">
            <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
              {node.description}
            </p>
          </Section>
        )}

        {/* Technology */}
        {node.tech_stack && node.tech_stack.length > 0 && (
          <Section title="Technology">
            <div className="flex flex-wrap gap-1">
              {node.tech_stack.map((t) => (
                <span
                  key={t}
                  className="px-1.5 py-0.5 bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded text-[10px] font-mono text-[var(--color-cyan)]"
                >
                  {t}
                </span>
              ))}
            </div>
          </Section>
        )}

        {/* Deployment */}
        {node.deployment_targets && node.deployment_targets.length > 0 && (
          <Section title="Deployment">
            <div className="flex flex-wrap gap-1">
              {node.deployment_targets.map((t) => (
                <span
                  key={t}
                  className="px-1.5 py-0.5 bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded text-[10px] font-mono text-[var(--color-text-secondary)]"
                >
                  {t}
                </span>
              ))}
            </div>
          </Section>
        )}

        {/* Governance */}
        {(node.required_tests?.length ?? 0) > 0 && (
          <Section title="Governance">
            <Row label="Tests" value={(node.required_tests ?? []).join(', ')} />
            {node.privileges && (
              <div className="mt-1">
                <span className="text-[10px] text-[var(--color-text-muted)]">Privileges:</span>
                {Object.entries(node.privileges).map(([k, v]) => (
                  <Row key={k} label={k} value={v} />
                ))}
              </div>
            )}
          </Section>
        )}

        {/* Telemetry */}
        {node.telemetry_endpoints && node.telemetry_endpoints.length > 0 && (
          <Section title="Telemetry">
            {node.telemetry_endpoints.map((ep) => (
              <code key={ep} className="block text-[10px] text-[var(--color-purple)]">
                {ep}
              </code>
            ))}
          </Section>
        )}

        {/* Immutable Flags */}
        {node.immutable_flags && node.immutable_flags.length > 0 && (
          <Section title="Immutable Flags">
            {node.immutable_flags.map((f) => (
              <code key={f} className="block text-[10px] text-[var(--color-amber)]">
                {f}
              </code>
            ))}
          </Section>
        )}
      </div>
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

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-xs font-mono">
      <span className="text-[var(--color-text-muted)]">{label}</span>
      <span className="text-[var(--color-text-secondary)]">{value}</span>
    </div>
  )
}
