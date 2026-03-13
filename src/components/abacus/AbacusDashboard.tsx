/**
 * pow3r.control - Abacus Platform Dashboard
 *
 * Purpose:
 * - Live tool registry from /api/mcp/topology filtered for Abacus
 * - Conversation browser, KG viewer, media gallery, job monitor tabs
 */
import { useState, useEffect } from 'react'
import { useControlStore } from '../../store/control-store'
import { api } from '../../lib/api-client'

interface McpTool { name: string; description?: string }
interface McpServer { name: string; tools: McpTool[]; status?: string }

export function AbacusDashboard() {
  const setViewMode = useControlStore((s) => s.setViewMode)
  const [activeTab, setActiveTab] = useState<'tools' | 'conversations' | 'kg' | 'media' | 'jobs'>('tools')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [tools, setTools] = useState<Array<{ name: string; category: string; description?: string }>>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    (async () => {
      const res = await api.get<{ servers: McpServer[] }>('/api/mcp/topology')
      if (res.success && res.data?.servers) {
        const abacusServer = res.data.servers.find((s) => s.name === 'abacus' || s.name.includes('abacus'))
        const abacusTools = abacusServer?.tools ?? []
        const categorized = abacusTools.map((t) => {
          let category = 'AI/ML'
          if (t.name.includes('conversation') || t.name.includes('chat')) category = 'Conversations'
          else if (t.name.includes('knowledge_graph') || t.name.includes('kg') || t.name.includes('entities') || t.name.includes('relationships')) category = 'Knowledge Graph'
          else if (t.name.includes('image') || t.name.includes('video') || t.name.includes('media')) category = 'Media'
          else if (t.name.includes('job')) category = 'Jobs'
          return { name: t.name, category, description: t.description }
        })
        setTools(categorized)
      }
      setLoading(false)
    })()
  }, [])

  const filteredTools = categoryFilter === 'all'
    ? tools
    : tools.filter((t) => t.category === categoryFilter)

  const categories = Array.from(new Set(tools.map((t) => t.category)))

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
          {loading && <p className="font-mono text-[10px] text-[var(--color-text-muted)]">Loading tools from MCP topology...</p>}
          <div className="flex gap-2">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-2 py-1 rounded bg-[var(--color-bg-card)] border border-[var(--color-border)] font-mono text-[10px]"
            >
              <option value="all">All ({tools.length})</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c} ({tools.filter((t) => t.category === c).length})
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
