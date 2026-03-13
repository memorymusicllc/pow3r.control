/**
 * pow3r.control - Data / Knowledge View
 *
 * Purpose:
 * - Live inventory of all data stores from /api/data/inventory
 * - KV, D1, R2, Vectorize, Knowledge Bases with real availability and counts
 */
import { useEffect } from 'react'
import { useDataInventoryStore, type StoreItem } from '../../store/data-inventory-store'

function StoreCard({ item }: { item: StoreItem & { id?: string; type?: string; documentCount?: number | string | null } }) {
  const available = item.available
  const borderColor = available ? 'var(--color-success)' : 'var(--color-border)'
  const nameColor = available ? 'var(--color-cyan)' : 'var(--color-text-muted)'
  const count = item.itemCount ?? item.tableCount ?? item.documentCount

  return (
    <div className="px-4 py-3 rounded border bg-[var(--color-bg-card)] font-mono text-[10px]" style={{ borderColor }}>
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: available ? 'var(--color-success)' : 'var(--color-error)' }} />
        <span style={{ color: nameColor }}>{item.name}</span>
        {count != null && <span className="ml-auto text-[var(--color-text-secondary)]">{count} items</span>}
      </div>
      <div className="mt-1 text-[var(--color-text-muted)]">{item.description}</div>
    </div>
  )
}

export function DataKnowledgeView() {
  const { kvStores, d1Databases, r2Buckets, vectorizeIndexes, knowledgeBases, summary, loading, error, fetchInventory } = useDataInventoryStore()

  useEffect(() => { fetchInventory() }, [fetchInventory])

  const sections = [
    { title: `KV Namespaces (${summary.kvAvailable ?? 0}/${summary.kvTotal ?? 0})`, items: kvStores },
    { title: `D1 Databases (${summary.d1Available ?? 0}/${summary.d1Total ?? 0})`, items: d1Databases },
    { title: `R2 Buckets (${summary.r2Available ?? 0}/${summary.r2Total ?? 0})`, items: r2Buckets },
    { title: `Vectorize Indexes (${summary.vectorizeAvailable ?? 0}/${summary.vectorizeTotal ?? 0})`, items: vectorizeIndexes },
    { title: `Knowledge Bases (${summary.kbAvailable ?? 0}/${summary.kbTotal ?? 0})`, items: knowledgeBases },
  ]

  return (
    <div className="px-5 py-4 space-y-6">
      <h2 className="font-mono text-sm font-semibold text-[var(--color-cyan)]">Data & Knowledge</h2>
      {loading && <p className="font-mono text-[10px] text-[var(--color-text-muted)]">Loading inventory...</p>}
      {error && <p className="font-mono text-[10px] text-[var(--color-error)]">{error}</p>}

      {sections.map((section) => (
        <div key={section.title}>
          <h3 className="font-mono text-[10px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-2">
            {section.title}
          </h3>
          <div className="grid gap-2 sm:grid-cols-2" style={{ maxWidth: 520 }}>
            {section.items.map((d) => (
              <StoreCard key={d.binding || (d as { id?: string }).id} item={d} />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
