/**
 * pow3r.control - PKG Knowledge Overlay (Layer 5: Intelligence)
 *
 * Purpose:
 * - When a node is selected, queries PKG for related knowledge documents
 * - Displays related documents, best practices, and knowledge connections
 * - Fetches from config.superbots.link/api/pkg/search via HTTP
 * - Provides intelligence context for CTO/Architect decision-making
 *
 * Agent Instructions:
 * - Uses fetch to PKG search endpoint (not MCP, since this is a browser app)
 * - Caches results per node to avoid redundant queries
 * - Shows loading state during fetch
 */
import { useState, useEffect, useRef } from 'react'
import { useControlStore, selectSelectedNode } from '../../store/control-store'

const PKG_API = 'https://config.superbots.link/api/pkg'

interface PKGDocument {
  id: string
  title: string
  content: string
  score: number
  metadata?: Record<string, unknown>
}

interface PKGResult {
  documents: PKGDocument[]
  query: string
  timestamp: string
}

export function PKGOverlay() {
  const node = useControlStore(selectSelectedNode)
  const showGovernanceOverlay = useControlStore((s) => s.showGovernanceOverlay)

  const [result, setResult] = useState<PKGResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isExpanded, setIsExpanded] = useState(true)
  const cache = useRef<Map<string, PKGResult>>(new Map())

  useEffect(() => {
    if (!node || !showGovernanceOverlay) {
      setResult(null)
      return
    }

    const cached = cache.current.get(node.node_id)
    if (cached) {
      setResult(cached)
      return
    }

    const query = `${node.name} ${node.node_type} ${(node.tech_stack ?? []).join(' ')}`
    setIsLoading(true)
    setError(null)

    fetchPKG(query)
      .then((res) => {
        cache.current.set(node.node_id, res)
        setResult(res)
      })
      .catch((err) => {
        setError(err.message)
        setResult({ documents: [], query, timestamp: new Date().toISOString() })
      })
      .finally(() => setIsLoading(false))
  }, [node?.node_id, showGovernanceOverlay])

  if (!node || !showGovernanceOverlay) return null

  return (
    <div className="absolute top-14 left-2 w-72 max-h-[60vh] bg-[var(--color-bg-panel)] border border-[var(--color-border)] rounded-lg overflow-hidden z-15 flex flex-col">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between px-3 py-2 border-b border-[var(--color-border)] shrink-0 hover:bg-[var(--color-bg-card)] transition-colors"
      >
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[var(--color-purple)]" />
          <span className="font-mono text-[10px] font-semibold text-[var(--color-text-primary)]">
            PKG Intelligence
          </span>
        </div>
        <span className="text-[var(--color-text-muted)] text-xs">{isExpanded ? '-' : '+'}</span>
      </button>

      {isExpanded && (
        <div className="flex-1 overflow-y-auto p-3 space-y-3">
          {/* Query info */}
          <div className="font-mono text-[9px] text-[var(--color-text-muted)]">
            Querying for: <span className="text-[var(--color-purple)]">{node.name}</span>
          </div>

          {/* Loading */}
          {isLoading && (
            <div className="flex items-center gap-2 py-4">
              <div className="w-3 h-3 border border-[var(--color-purple)] border-t-transparent rounded-full animate-spin" />
              <span className="font-mono text-[10px] text-[var(--color-text-muted)]">Searching PKG...</span>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="p-2 bg-[#FF3D0010] border border-[#FF3D0030] rounded text-[10px] font-mono text-[var(--color-error)]">
              PKG unavailable: {error}
            </div>
          )}

          {/* Results */}
          {result && !isLoading && (
            <>
              <div className="font-mono text-[9px] text-[var(--color-text-muted)]">
                {result.documents.length} documents found
              </div>

              {result.documents.length === 0 && !error && (
                <div className="py-4 text-center">
                  <span className="font-mono text-[10px] text-[var(--color-text-muted)]">
                    No PKG knowledge found for this node
                  </span>
                </div>
              )}

              {result.documents.map((doc) => (
                <div
                  key={doc.id}
                  className="p-2 bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded hover:border-[var(--color-purple)] transition-colors"
                >
                  <div className="flex items-start justify-between gap-1">
                    <span className="font-mono text-[10px] font-semibold text-[var(--color-text-primary)] line-clamp-2">
                      {doc.title}
                    </span>
                    <span className="font-mono text-[8px] text-[var(--color-purple)] shrink-0">
                      {Math.round(doc.score * 100)}%
                    </span>
                  </div>
                  <p className="font-mono text-[9px] text-[var(--color-text-secondary)] mt-1 line-clamp-3">
                    {doc.content}
                  </p>
                  {doc.metadata?.tags && Array.isArray(doc.metadata.tags) ? (
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {(doc.metadata.tags as string[]).slice(0, 4).map((tag: string) => (
                        <span
                          key={tag}
                          className="px-1 py-0.5 text-[7px] font-mono rounded bg-[var(--color-bg-panel)] text-[var(--color-text-muted)]"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </div>
              ))}
            </>
          )}

          {/* Node tech tags as search context */}
          {node.tech_stack && node.tech_stack.length > 0 && (
            <div>
              <span className="font-mono text-[8px] text-[var(--color-text-muted)] uppercase tracking-wider">
                Technology Context
              </span>
              <div className="flex flex-wrap gap-1 mt-1">
                {node.tech_stack.map((t) => (
                  <span
                    key={t}
                    className="px-1.5 py-0.5 text-[9px] font-mono rounded bg-[var(--color-bg-card)] border border-[var(--color-border)] text-[var(--color-cyan)]"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

async function fetchPKG(query: string): Promise<PKGResult> {
  try {
    const res = await fetch(`${PKG_API}/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, topK: 5 }),
    })

    if (!res.ok) throw new Error(`PKG API returned ${res.status}`)

    const json = await res.json() as {
      success?: boolean
      results?: Array<{ id: string; title: string; content: string; score: number; metadata?: Record<string, unknown> }>
      data?: { results?: Array<{ id: string; title: string; content: string; score: number; metadata?: Record<string, unknown> }> }
    }

    const docs = json.data?.results ?? json.results ?? []

    return {
      documents: docs.map((d) => ({
        id: d.id ?? `pkg-${Math.random()}`,
        title: d.title ?? 'Untitled',
        content: d.content ?? '',
        score: d.score ?? 0,
        metadata: d.metadata,
      })),
      query,
      timestamp: new Date().toISOString(),
    }
  } catch (err) {
    throw new Error((err as Error).message)
  }
}
