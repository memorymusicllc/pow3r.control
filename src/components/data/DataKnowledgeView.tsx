/**
 * pow3r.control - Data / Knowledge View
 *
 * Purpose:
 * - Complete inventory of all data stores: KV, D1, R2, Vectorize
 * - Knowledge bases: PKG, MKB, PKB, TKB, PPG (TKG/AKG)
 * - Component Library, Workflow Library, PDAM, Plans, NOTESAI Vault, Prompt db, Chat db
 * - Sources: wrangler.toml, docs, v7 XMAPs, Uber Master
 */
type DataItem = { id: string; name: string; desc: string; count?: string }

const KV_STORES: DataItem[] = [
  { id: 'CONFIG_STORE', name: 'CONFIG_STORE', desc: 'XMAP configs, plan_memory:index, fallback to static bundled' },
  { id: 'CREDENTIAL_STORE', name: 'CREDENTIAL_STORE', desc: 'Pass credential cache (validation results)' },
  { id: 'WORKFLOW_LIBRARY', name: 'WORKFLOW_LIBRARY', desc: '109 workflow templates, pattern learning' },
  { id: 'KG_STORE', name: 'KG_STORE', desc: 'Knowledge graph metadata' },
  { id: 'ABI_ORCHESTRATOR_KV', name: 'ABI_ORCHESTRATOR_KV', desc: 'Abi task state, workflow learning patterns' },
  { id: 'MKB_STORE', name: 'MKB_STORE', desc: 'Master Knowledge Base (4,751 NOTESAI files)' },
  { id: 'CHAT_STORE', name: 'CHAT_STORE', desc: 'Unified chat (Cursor, Abacus, Gemini, Grok, Telegram)' },
  { id: 'PKB_STORE', name: 'PKB_STORE', desc: 'Personal Knowledge Base (Obsidian vault)' },
]

const D1_DATABASES: DataItem[] = [
  { id: 'ANALYTICS_DB', name: 'ANALYTICS_DB', desc: 'pow3r-config-analytics' },
  { id: 'ABI_ORCHESTRATOR_DB', name: 'ABI_ORCHESTRATOR_DB', desc: 'abi-orchestrator-db, workflow pattern learning' },
  { id: 'CHAT_HISTORY_DB', name: 'CHAT_HISTORY_DB', desc: 'chat-history-db, queryable SQL' },
]

const R2_BUCKETS: DataItem[] = [
  { id: 'EVIDENCE_STORE', name: 'EVIDENCE_STORE', desc: 'pow3r-evidence-store, screenshots, traces' },
  { id: 'PDAM_ASSETS', name: 'PDAM_ASSETS', desc: 'pow3r-pdam-assets' },
  { id: 'LIBRARY_STORE', name: 'LIBRARY_STORE', desc: 'pow3r-library-store, PIMP/PDAM UI' },
]

const VECTORIZE_INDEXES: DataItem[] = [
  { id: 'PKG_INDEX', name: 'PKG_INDEX', desc: 'pkg-index, 3,127 doc embeddings' },
  { id: 'MKB_INDEX', name: 'MKB_INDEX', desc: 'mkb-index, Master KB embeddings' },
  { id: 'PKB_INDEX', name: 'PKB_INDEX', desc: 'pkb-index, 768-dim, Obsidian vault' },
  { id: 'PPG_INDEX', name: 'PPG_INDEX', desc: 'ppg-index, Pow3r Pitch Graph RAG' },
]

const KNOWLEDGE_BASES: DataItem[] = [
  { id: 'pkg', name: 'PKG', desc: 'Product Knowledge Graph', count: '3,127 docs, 3,938 edges' },
  { id: 'mkb', name: 'MKB', desc: 'Master Knowledge Base (TKG/AKG)', count: 'MKB_STORE + MKB_INDEX' },
  { id: 'pkb', name: 'PKB', desc: 'Personal Knowledge Base', count: 'Obsidian NOTESAI vault' },
  { id: 'tkb', name: 'TKB', desc: 'Telegram Knowledge Base', count: 'CHAT_STORE / CONFIG_STORE' },
  { id: 'ppg', name: 'PPG', desc: 'Pow3r Pitch Graph', count: 'Writer Pitch Mode RAG' },
]

const OTHER_DATA: DataItem[] = [
  { id: 'workflow-library', name: 'Workflow Library', desc: '109 workflows in WORKFLOW_LIBRARY KV' },
  { id: 'component-library', name: 'Component Library', desc: '139 configs at config.superbots.link/library' },
  { id: 'pdam-db', name: 'PDAM DB', desc: 'Projects and digital assets, R2 + D1' },
  { id: 'plans-db', name: 'Plans DB', desc: 'plan_memory:index in CONFIG_STORE' },
  { id: 'notesai-vault', name: 'NOTESAI Vault', desc: 'Cloud copy of local Obsidian vault (MKB/PKB source)' },
  { id: 'prompt-db', name: 'Prompt DB', desc: 'prompts.md + plan: KV prompt:{agentId}:{ts}' },
  { id: 'chat-db', name: 'Chat DB', desc: 'CHAT_STORE KV + CHAT_HISTORY_DB D1' },
]

export function DataKnowledgeView() {
  const sections = [
    { title: 'KV Namespaces', items: KV_STORES },
    { title: 'D1 Databases', items: D1_DATABASES },
    { title: 'R2 Buckets', items: R2_BUCKETS },
    { title: 'Vectorize Indexes', items: VECTORIZE_INDEXES },
    { title: 'Knowledge Bases', items: KNOWLEDGE_BASES },
    { title: 'Other Data Stores', items: OTHER_DATA },
  ]

  return (
    <div className="p-4 space-y-6">
      <h2 className="font-mono text-sm font-semibold text-[var(--color-cyan)]">Data & Knowledge</h2>
      <p className="font-mono text-[10px] text-[var(--color-text-muted)]">
        Complete inventory: KV, D1, R2, Vectorize, KG/KB, Component Library, Workflow Library, PDAM, Plans, NOTESAI Vault, Prompt db, Chat db
      </p>

      {sections.map((section) => (
        <div key={section.title}>
          <h3 className="font-mono text-[10px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-2">
            {section.title}
          </h3>
          <div className="grid gap-2 sm:grid-cols-2" style={{ maxWidth: 520 }}>
            {section.items.map((d) => (
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
      ))}
    </div>
  )
}
