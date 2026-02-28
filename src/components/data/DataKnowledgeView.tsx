/**
 * pow3r.control - Data / Knowledge View
 *
 * Purpose:
 * - View KG, KB, vector bases, databases
 * - Aggregates from PKG, MKB, PKB, etc.
 */
export function DataKnowledgeView() {
  const dataSources = [
    { id: 'pkg', name: 'PKG', desc: 'Product Knowledge Graph', count: '3,127 nodes' },
    { id: 'mkb', name: 'MKB', desc: 'Media Knowledge Base' },
    { id: 'pkb', name: 'PKB', desc: 'Personal Knowledge Base' },
    { id: 'kg', name: 'KG', desc: 'Knowledge Graph' },
    { id: 'vectorize', name: 'Vector Bases', desc: 'PKG_INDEX, MKB_INDEX, PKB_INDEX, PPG_INDEX' },
    { id: 'd1', name: 'D1 Databases', desc: 'Analytics, ABI, Chat History' },
  ]

  return (
    <div className="p-4 space-y-4">
      <h2 className="font-mono text-sm font-semibold text-[var(--color-cyan)]">Data & Knowledge</h2>
      <p className="font-mono text-[10px] text-[var(--color-text-muted)]">
        KG, KB, vector bases, knowledge bases
      </p>
      <div className="grid gap-2 sm:grid-cols-2" style={{ maxWidth: 520 }}>
        {dataSources.map((d) => (
          <div
            key={d.id}
            className="p-3 rounded border border-[var(--color-border)] bg-[var(--color-bg-card)] font-mono text-[10px]"
          >
            <span className="text-[var(--color-cyan)]">{d.name}</span>
            <span className="ml-2 text-[var(--color-text-muted)]">{d.desc}</span>
            {d.count && <span className="block mt-1 text-[var(--color-text-secondary)]">{d.count}</span>}
          </div>
        ))}
      </div>
    </div>
  )
}
