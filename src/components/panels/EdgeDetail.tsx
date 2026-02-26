/**
 * pow3r.control - Edge Detail Panel
 *
 * Purpose:
 * - Shows metadata for a selected XMAP v7 edge
 * - Displays connection, permissions, security, edge type
 */
import { useControlStore, selectSelectedEdge } from '../../store/control-store'
import { EDGE_TYPE_STYLES } from '../../lib/types'

export function EdgeDetail() {
  const edge = useControlStore(selectSelectedEdge)
  const config = useControlStore((s) => s.config)
  const selectEdge = useControlStore((s) => s.selectEdge)

  if (!edge) return null

  const style = EDGE_TYPE_STYLES[edge.edge_type] ?? EDGE_TYPE_STYLES.data
  const fromNode = config?.nodes.find((n) => n.node_id === edge.from_node)
  const toNode = config?.nodes.find((n) => n.node_id === edge.to_node)

  return (
    <div className="absolute top-0 right-0 w-80 h-full bg-[var(--color-bg-panel)] border-l border-[var(--color-border)] overflow-y-auto z-20">
      <div className="sticky top-0 bg-[var(--color-bg-panel)] border-b border-[var(--color-border)] p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-1 rounded" style={{ backgroundColor: style.color }} />
            <span className="font-mono text-xs">{style.label}</span>
          </div>
          <button
            onClick={() => selectEdge(null)}
            className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] text-lg leading-none"
          >
            x
          </button>
        </div>
        <code className="text-[10px] text-[var(--color-text-muted)] mt-1 block">{edge.edge_id}</code>
      </div>

      <div className="p-3 space-y-4">
        <Section title="Connection">
          <Row label="From" value={fromNode?.name ?? edge.from_node} />
          <Row label="To" value={toNode?.name ?? edge.to_node} />
          <Row label="Type" value={edge.edge_type} />
        </Section>

        {edge.permission_schema && Object.keys(edge.permission_schema).length > 0 && (
          <Section title="Permissions">
            {Object.entries(edge.permission_schema).map(([k, v]) => (
              <Row key={k} label={k} value={v} />
            ))}
          </Section>
        )}

        {edge.allowed_agents_roles && edge.allowed_agents_roles.length > 0 && (
          <Section title="Allowed Roles">
            <div className="flex flex-wrap gap-1">
              {edge.allowed_agents_roles.map((r) => (
                <span
                  key={r}
                  className="px-1.5 py-0.5 bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded text-[10px] font-mono text-[var(--color-magenta)]"
                >
                  {r}
                </span>
              ))}
            </div>
          </Section>
        )}

        {edge.encryption_policy && (
          <Section title="Security">
            <Row label="Encryption" value={edge.encryption_policy} />
          </Section>
        )}

        {edge.provenance_requirements && (
          <Section title="Provenance">
            <Row label="Requirements" value={edge.provenance_requirements} />
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
