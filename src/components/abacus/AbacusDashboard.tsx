/**
 * pow3r.control - Abacus Platform Dashboard
 *
 * Purpose:
 * - 38-tool registry grid, conversation browser, KG viewer, media gallery, job monitor
 * - Card per tool with description, category, and action
 */
import { useState } from 'react'
import { useControlStore } from '../../store/control-store'

const TOOL_REGISTRY: Array<{ name: string; category: string; description?: string }> = [
  { name: 'abacus_image_generate', category: 'Media', description: 'Generate images from prompts' },
  { name: 'abacus_video_generate', category: 'Media', description: 'Generate videos from prompts' },
  { name: 'abacus_chat_complete', category: 'AI/ML' },
  { name: 'abacus_graph_rag_query', category: 'Knowledge Graph' },
  { name: 'abacus_deep_research', category: 'AI/ML' },
  { name: 'abacus_get_all_conversations', category: 'Conversations' },
  { name: 'abacus_get_project_conversations', category: 'Conversations' },
  { name: 'abacus_get_deepagent_conversations', category: 'Conversations' },
  { name: 'abacus_list_deployment_conversations', category: 'Conversations' },
  { name: 'abacus_get_deployment_conversation', category: 'Conversations' },
  { name: 'abacus_get_chat_session', category: 'Conversations' },
  { name: 'abacus_export_chat_session', category: 'Conversations' },
  { name: 'abacus_list_conversations_by_app', category: 'Conversations' },
  { name: 'abacus_get_conversation_by_id', category: 'Conversations' },
  { name: 'abacus_create_knowledge_graph', category: 'Knowledge Graph' },
  { name: 'abacus_add_entities', category: 'Knowledge Graph' },
  { name: 'abacus_add_relationships', category: 'Knowledge Graph' },
  { name: 'abacus_query_knowledge_graph', category: 'Knowledge Graph' },
  { name: 'abacus_tune_knowledge_graph', category: 'Knowledge Graph' },
  { name: 'abacus_get_kg_statistics', category: 'Knowledge Graph' },
  { name: 'abacus_list_knowledge_graphs', category: 'Knowledge Graph' },
  { name: 'abacus_delete_knowledge_graph', category: 'Knowledge Graph' },
  { name: 'abacus_export_knowledge_graph', category: 'Knowledge Graph' },
  { name: 'abacus_import_knowledge_graph', category: 'Knowledge Graph' },
  { name: 'abacus_list_models', category: 'AI/ML' },
  { name: 'abacus_list_datasets', category: 'AI/ML' },
  { name: 'abacus_create_job', category: 'Jobs' },
  { name: 'abacus_get_job_status', category: 'Jobs' },
  { name: 'abacus_cancel_job', category: 'Jobs' },
  { name: 'abacus_batch_media_generate', category: 'Media' },
  { name: 'abacus_list_deployments', category: 'AI/ML' },
  { name: 'abacus_get_deployment_status', category: 'AI/ML' },
  { name: 'abacus_list_agents', category: 'AI/ML' },
  { name: 'abacus_get_agent', category: 'AI/ML' },
  { name: 'abacus_update_agent', category: 'AI/ML' },
  { name: 'abacus_conversation_stats', category: 'Conversations' },
  { name: 'abacus_health_check', category: 'AI/ML' },
]

export function AbacusDashboard() {
  const setViewMode = useControlStore((s) => s.setViewMode)
  const [activeTab, setActiveTab] = useState<'tools' | 'conversations' | 'kg' | 'media' | 'jobs'>('tools')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')

  const filteredTools = categoryFilter === 'all'
    ? TOOL_REGISTRY
    : TOOL_REGISTRY.filter((t) => t.category === categoryFilter)

  const categories = Array.from(new Set(TOOL_REGISTRY.map((t) => t.category)))

  return (
    <div className="p-4 space-y-4">
      <div className="flex gap-2 flex-wrap">
        {(['tools', 'conversations', 'kg', 'media', 'jobs'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`font-mono text-[10px] px-3 py-1.5 rounded ${
              activeTab === tab
                ? 'bg-[var(--color-cyan)]20 text-[var(--color-cyan)]'
                : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {activeTab === 'tools' && (
        <>
          <div className="flex gap-2">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-2 py-1 rounded bg-[var(--color-bg-card)] border border-[var(--color-border)] font-mono text-[10px]"
            >
              <option value="all">All ({TOOL_REGISTRY.length})</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c} ({TOOL_REGISTRY.filter((t) => t.category === c).length})
                </option>
              ))}
            </select>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3" style={{ maxWidth: 520 }}>
            {filteredTools.map((t) => (
              <div
                key={t.name}
                className="p-3 rounded border border-[var(--color-border)] bg-[var(--color-bg-card)] hover:border-[var(--color-cyan)] transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <code className="font-mono text-[11px] text-[var(--color-cyan)] truncate block">
                      {t.name}
                    </code>
                    <span className="font-mono text-[9px] text-[var(--color-text-muted)] mt-0.5 block">
                      {t.category}
                      {t.description && ` · ${t.description}`}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setViewMode('playground')}
                  className="mt-2 font-mono text-[9px] px-2 py-1 rounded bg-[var(--color-cyan)]20 text-[var(--color-cyan)] hover:bg-[var(--color-cyan)]30 min-h-[44px] min-w-[44px]"
                  title="Open in playground"
                >
                  Test
                </button>
              </div>
            ))}
          </div>
        </>
      )}

      {activeTab === 'conversations' && (
        <div className="p-4 rounded border border-[var(--color-border)] bg-[var(--color-bg-card)]">
          <p className="font-mono text-[10px] text-[var(--color-text-muted)]">
            Conversation browser: abacus_list_deployment_conversations
          </p>
        </div>
      )}

      {activeTab === 'kg' && (
        <div className="p-4 rounded border border-[var(--color-border)] bg-[var(--color-bg-card)]">
          <p className="font-mono text-[10px] text-[var(--color-text-muted)]">
            Knowledge Graph viewer: abacus_query_knowledge_graph
          </p>
        </div>
      )}

      {activeTab === 'media' && (
        <div className="p-4 rounded border border-[var(--color-border)] bg-[var(--color-bg-card)]">
          <p className="font-mono text-[10px] text-[var(--color-text-muted)]">
            Media gallery: abacus_image_generate, abacus_video_generate
          </p>
        </div>
      )}

      {activeTab === 'jobs' && (
        <div className="p-4 rounded border border-[var(--color-border)] bg-[var(--color-bg-card)]">
          <p className="font-mono text-[10px] text-[var(--color-text-muted)]">
            Job monitor: abacus_get_job_status
          </p>
        </div>
      )}
    </div>
  )
}
