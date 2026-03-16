/**
 * pow3r.control - Node Detail Panel (XMAP v7 "everything-you-need-to-know")
 *
 * Purpose:
 * - Rich detail panel matching pHAi blueprint
 * - Section order: Description, Technology, Function, Process Details, Features,
 *   Integration, Best Practices, Deployment, Governance, Telemetry, Technical, etc.
 * - Collapse toggle minimizes panel while keeping selection
 */
import { useState } from 'react'
import { useControlStore, selectSelectedNode } from '../../store/control-store'
import { NODE_TYPE_COLORS, STATUS_COLORS } from '../../lib/types'
import type { NodeType } from '../../lib/types'

function deriveFunction(nodeType: NodeType): string {
  const map: Record<NodeType, string> = {
    service: 'API gateway, orchestration, business logic',
    ui: 'User interface, visualization, dashboards',
    data: 'Data storage, indexing, retrieval',
    workflow: 'Workflow execution, orchestration',
    observer: 'Observability, telemetry, logging',
    component_factory: 'Component instantiation, configuration',
    mcp_server: 'MCP protocol, tool exposure',
    gateway: 'Routing, access control, integration',
    agent: 'AI agent, autonomous execution',
  }
  return map[nodeType] ?? 'Component in XMAP architecture'
}

export function NodeDetail() {
  const node = useControlStore(selectSelectedNode)
  const selectNode = useControlStore((s) => s.selectNode)
  const expandNode = useControlStore((s) => s.expandNode)
  const expandedNodeId = useControlStore((s) => s.expandedNodeId)
  const [isCollapsed, setIsCollapsed] = useState(false)

  if (!node) return null

  const typeColor = NODE_TYPE_COLORS[node.node_type] ?? '#888'
  const statusColor = STATUS_COLORS[node.status] ?? '#555'
  const functionText = node.function ?? deriveFunction(node.node_type)
  const features = node.features ?? node.tech_stack ?? []
  const infrastructure = node.infrastructure ?? node.deployment_targets?.join(', ')

  return (
    <div className={`absolute top-0 right-0 bg-[var(--color-bg-panel)] border-l border-[var(--color-border)] z-20 flex flex-col ${isCollapsed ? 'w-12 h-auto' : 'w-80 max-w-[90vw] h-full overflow-y-auto'}`}>
      {/* Header */}
      <div className="sticky top-0 bg-[var(--color-bg-panel)] border-b border-[var(--color-border)] px-4 py-3 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <button
              onClick={() => setIsCollapsed((c) => !c)}
              className="shrink-0 p-0.5 text-[var(--color-text-muted)] hover:text-[var(--color-cyan)] min-w-[32px] min-h-[32px] flex items-center justify-center"
              title={isCollapsed ? 'Expand panel' : 'Collapse panel'}
              aria-label={isCollapsed ? 'Expand' : 'Collapse'}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={isCollapsed ? 'rotate-180' : ''}>
                <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            {!isCollapsed && (
              <>
                <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: typeColor }} />
                <span className="font-mono text-xs text-[var(--color-text-secondary)] truncate">
                  {node.node_type}
                </span>
              </>
            )}
          </div>
          <div className="flex items-center gap-1">
            {!isCollapsed && (
              <button
                onClick={() => expandNode(expandedNodeId === node.node_id ? null : node.node_id)}
                className={`font-mono text-[9px] px-2 py-0.5 rounded min-h-[32px] ${
                  expandedNodeId === node.node_id
                    ? 'text-[var(--color-cyan)] bg-[var(--color-bg-card)]'
                    : 'text-[var(--color-text-muted)] hover:text-[var(--color-cyan)] hover:bg-[var(--color-bg-card)]'
                }`}
                title="Expand / drill down"
              >
                Expand
              </button>
            )}
            <button
              onClick={() => selectNode(null)}
              className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] text-lg leading-none min-w-[32px] min-h-[32px] flex items-center justify-center"
              title="Close panel"
            >
              x
            </button>
          </div>
        </div>
        {!isCollapsed && (
          <>
            <h3 className="font-mono text-sm font-semibold mt-1">{node.name}</h3>
            <code className="text-[10px] text-[var(--color-text-muted)]">{node.node_id}</code>
          </>
        )}
      </div>

      {!isCollapsed && (
        <div className="px-4 py-3 space-y-4 flex-1">
          {/* Status */}
          <Section title="Status">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: statusColor }} />
              <span className="font-mono text-xs capitalize">{node.status}</span>
            </div>
            {node.owner && <Row label="Owner" value={node.owner} />}
          </Section>

          {/* Blockers / Last Error (CTO insights from XMAP) */}
          {(node.developmentStatus?.blockers?.length ?? 0) > 0 && (
            <Section title="Blockers">
              <ul className="text-xs text-[var(--color-error)] space-y-0.5 list-disc list-inside">
                {node.developmentStatus!.blockers!.map((b) => (
                  <li key={b}>{b}</li>
                ))}
              </ul>
            </Section>
          )}
          {node.developmentStatus?.lastError && (
            <Section title="Last Error">
              <p className="text-xs text-[var(--color-error)] font-mono break-words">
                {node.developmentStatus.lastError}
              </p>
            </Section>
          )}
          {node.developmentStatus?.lastDeployAttempt && (
            <Section title="Last Deploy">
              <p className="text-xs text-[var(--color-text-muted)] font-mono">
                {node.developmentStatus.lastDeployAttempt}
              </p>
            </Section>
          )}

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

          {/* Function */}
          <Section title="Function">
            <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">{functionText}</p>
          </Section>

          {/* Process Details */}
          {node.process_details && (
            <Section title="Process Details">
              <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                {node.process_details}
              </p>
            </Section>
          )}

          {/* Features */}
          {features.length > 0 && (
            <Section title="Features">
              <ul className="text-xs text-[var(--color-text-secondary)] space-y-0.5 list-disc list-inside">
                {features.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
            </Section>
          )}

          {/* Integration */}
          {node.integration && (
            <Section title="Integration">
              <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                {node.integration}
              </p>
            </Section>
          )}

          {/* Best Practices */}
          {node.best_practices && node.best_practices.length > 0 && (
            <Section title="Best Practices">
              <ul className="text-xs text-[var(--color-text-secondary)] space-y-0.5 list-disc list-inside">
                {node.best_practices.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
            </Section>
          )}

          {/* Memory Pattern */}
          {node.memory_pattern && (
            <Section title="Memory Pattern">
              <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                {node.memory_pattern}
              </p>
            </Section>
          )}

          {/* Deployment / Infrastructure */}
          {(node.deployment_targets?.length ?? 0) > 0 && (
            <Section title="Deployment">
              <div className="flex flex-wrap gap-1">
                {node.deployment_targets!.map((t) => (
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
          {infrastructure && !node.deployment_targets?.length && (
            <Section title="Infrastructure">
              <p className="text-xs text-[var(--color-text-secondary)]">{infrastructure}</p>
            </Section>
          )}

          {/* Governance */}
          {((node.required_tests?.length ?? 0) > 0 || node.privileges) && (
            <Section title="Governance">
              {node.required_tests && node.required_tests.length > 0 && (
                <Row label="Tests" value={node.required_tests.join(', ')} />
              )}
              {node.privileges &&
                Object.entries(node.privileges).map(([k, v]) => (
                  <Row key={k} label={k} value={v} />
                ))}
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

          {/* Technical */}
          {(node.latency_target || node.scaling) && (
            <Section title="Technical">
              {node.latency_target && (
                <Row label="Latency Target" value={node.latency_target} />
              )}
              {node.scaling && <Row label="Scaling" value={node.scaling} />}
            </Section>
          )}

          {/* Key Data Types */}
          {node.key_data_types && node.key_data_types.length > 0 && (
            <Section title="Key Data Types">
              <div className="flex flex-wrap gap-1">
                {node.key_data_types.map((k) => (
                  <span
                    key={k}
                    className="px-1.5 py-0.5 bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded text-[10px] font-mono"
                  >
                    {k}
                  </span>
                ))}
              </div>
            </Section>
          )}

          {/* Line Types (Edge Types) */}
          {node.line_types && node.line_types.length > 0 && (
            <Section title="Line Types">
              <div className="flex flex-wrap gap-1">
                {node.line_types.map((t) => (
                  <span
                    key={t}
                    className="px-1.5 py-0.5 bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded text-[10px] font-mono"
                  >
                    {t}
                  </span>
                ))}
              </div>
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
      )}
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
    <div className="flex justify-between gap-2 text-xs font-mono">
      <span className="text-[var(--color-text-muted)] shrink-0">{label}</span>
      <span className="text-[var(--color-text-secondary)] text-right break-words">{value}</span>
    </div>
  )
}
