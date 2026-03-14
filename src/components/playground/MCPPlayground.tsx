/**
 * pow3r.control - MCP Tool Playground
 *
 * Purpose:
 * - API playground for every MCP tool with X-System, XBugger, telemetry, AI insights
 * - PKG context via pkg_hybrid with expand/collapse, load more, view all
 * - Agent suggestions per tool
 *
 * Agent Instructions:
 * - Uses mcp-playground-api.ts for all API calls
 * - Styled with pow3r.control CSS vars
 */

import { useState, useCallback, useEffect, useMemo, useRef } from 'react'
import {
  fetchMCPTopology,
  callMCPTool,
  fetchPKGContext,
  getPKGSearchPageURL,
  getExampleArgs,
  pingMCP,
  type MCPTopology,
  type PlaygroundCallResult,
  type PKGSnippet,
} from '../../lib/mcp-playground-api'

const AGENT_SUGGESTIONS: Record<string, string[]> = {
  pkg_search: ['Ask Abi: "Search PKG for [topic]"', 'Ask Jaime: "What does PKG know about [X]?"'],
  pkg_hybrid: ['Ask Abi: "Hybrid search PKG for [query]"', 'Use in plan context for PKG Context section'],
  x_plugin_submit_observation: ['Log task start/complete in Enforcer Protocol', 'Track workflow events'],
  x_plugin_get_all_x_system_data: ['Required before deploy: get full X-System context', 'Check open X-Files cases'],
  workflow_library_run: ['Run workflow via Library tab or floating widget', 'Ask Abi: "Execute workflow [id]"'],
  pdam_list_projects: ['Browse PDAM tab for projects and assets', 'Ask Abi: "List PDAM projects"'],
  plan_memory_list: ['Check Plans Remaining in response block', 'Ask Abi: "List plans from plan_memory"'],
  '': [],
}

function getAgentSuggestions(toolName: string): string[] {
  const exact = AGENT_SUGGESTIONS[toolName]
  if (exact?.length) return exact
  const key = Object.keys(AGENT_SUGGESTIONS).find((k) => k && toolName.includes(k))
  return key
    ? AGENT_SUGGESTIONS[key]
    : [`Ask Abi: "Run ${toolName} with [args]"`, 'Use in workflow or agent task']
}

export function MCPPlayground() {
  const [topology, setTopology] = useState<MCPTopology | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedServer, setSelectedServer] = useState<string>('')
  const [selectedTool, setSelectedTool] = useState<string>('')
  const [argsJson, setArgsJson] = useState('{}')
  const [executing, setExecuting] = useState(false)
  const [lastResult, setLastResult] = useState<PlaygroundCallResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showXSystem, setShowXSystem] = useState(true)
  const [showXBugger, setShowXBugger] = useState(true)
  const [toolSearch, setToolSearch] = useState('')
  const [pkgContext, setPkgContext] = useState<{ query: string; snippets: PKGSnippet[] } | null>(null)
  const [pkgLoading, setPkgLoading] = useState(false)
  const [pkgExpanded, setPkgExpanded] = useState<Set<number>>(new Set())
  const [pkgLimit, setPkgLimit] = useState(10)
  const [pingStatus, setPingStatus] = useState<{ ok: boolean; latency: number; message: string } | null>(null)

  const selectedServerRef = useRef(selectedServer)
  selectedServerRef.current = selectedServer

  const loadTopology = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const t = await fetchMCPTopology()
      setTopology(t)
      if (t.servers.length && !selectedServerRef.current) {
        setSelectedServer(t.servers[0].name)
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadTopology()
  }, [loadTopology])

  // Load example args when tool selected
  useEffect(() => {
    if (!selectedTool || !topology) return
    const server = topology.servers.find((s) => s.name === selectedServer)
    const tool = server?.tools.find((t) => t.name === selectedTool)
    if (tool) {
      const ex = getExampleArgs(tool)
      setArgsJson(JSON.stringify(ex, null, 2))
    }
  }, [selectedTool, selectedServer, topology])

  useEffect(() => {
    if (!selectedTool) {
      setPkgContext(null)
      setPkgLimit(10)
      return
    }
    setPkgLimit(10)
    let cancelled = false
    setPkgLoading(true)
    setPkgContext(null)
    const query = `${selectedTool} MCP tool usage documentation`
    fetchPKGContext(query, 10)
      .then((ctx) => {
        if (cancelled) return
        setPkgContext(ctx)
        setPkgExpanded(new Set())
      })
      .catch(() => {
        if (!cancelled) setPkgContext(null)
      })
      .finally(() => {
        if (!cancelled) setPkgLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [selectedTool])

  const handlePkgLoadMore = useCallback(() => {
    if (!selectedTool || !pkgContext?.query || pkgLoading) return
    const nextLimit = pkgLimit + 10
    setPkgLimit(nextLimit)
    setPkgLoading(true)
    fetchPKGContext(pkgContext.query, nextLimit)
      .then((ctx) => {
        setPkgContext((prev) => (prev ? { ...prev, snippets: ctx.snippets } : null))
      })
      .finally(() => setPkgLoading(false))
  }, [selectedTool, pkgContext?.query, pkgLimit, pkgLoading])

  const toolsForServer = useMemo(() => {
    if (!topology) return []
    const server = topology.servers.find((s) => s.name === selectedServer)
    return server?.tools ?? []
  }, [topology, selectedServer])

  const filteredTools = useMemo(() => {
    const q = toolSearch.toLowerCase().trim()
    if (!q) return toolsForServer
    return toolsForServer.filter(
      (t) =>
        (t.name || '').toLowerCase().includes(q) || (t.description || '').toLowerCase().includes(q)
    )
  }, [toolsForServer, toolSearch])

  const toolOptions = filteredTools.map((t) => t.name)
  const agentSuggestions = useMemo(() => getAgentSuggestions(selectedTool), [selectedTool])

  const handleExecute = async () => {
    if (!selectedTool) return
    setExecuting(true)
    setError(null)
    setLastResult(null)
    try {
      let args: Record<string, unknown> = {}
      try {
        args = JSON.parse(argsJson || '{}')
      } catch {
        setError('Invalid JSON in arguments')
        setExecuting(false)
        return
      }
      const result = await callMCPTool(selectedServer, selectedTool, args)
      if (!result.ok) {
        const errMsg =
          (result.raw as { error?: { message?: string; details?: string } })?.error?.message ??
          (result.raw as { error?: { message?: string; details?: string } })?.error?.details ??
          'Request failed'
        setError(errMsg)
      } else {
        setLastResult(result)
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Request failed')
    } finally {
      setExecuting(false)
    }
  }

  if (loading && !topology) {
    return (
      <div className="flex items-center justify-center p-8 text-[var(--color-text-muted)]">
        <div className="w-6 h-6 border-2 border-[var(--color-cyan)] border-t-transparent rounded-full animate-spin mr-3" />
        Loading MCP tools...
      </div>
    )
  }

  return (
    <div className="space-y-6 p-4 max-w-[520px] mx-auto" data-testid="mcp-playground">
      <h2 className="font-mono text-sm font-bold tracking-tight text-[var(--color-text-primary)]">
        <span className="text-[var(--color-cyan)]">MCP</span> Tool Playground
      </h2>
      <p className="text-[10px] uppercase tracking-wider text-[var(--color-text-muted)]">
        Test any MCP tool with X-System, XBugger, telemetry, and AI insights
      </p>

      {/* PING button */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={async () => {
            setPingStatus(null)
            const result = await pingMCP()
            setPingStatus(result)
          }}
          className="font-mono text-[10px] px-3 py-1.5 rounded border border-[var(--color-border)] bg-[var(--color-bg-card)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-panel)] min-h-[36px]"
          title="Test connection to config.superbots.link"
        >
          [PING]
        </button>
        {pingStatus && (
          <span
            className={`font-mono text-[10px] ${pingStatus.ok ? 'text-[var(--color-success)]' : 'text-[var(--color-error)]'}`}
            title={pingStatus.message}
          >
            {pingStatus.ok ? `${pingStatus.latency}ms` : pingStatus.message}
          </span>
        )}
      </div>

      {/* Server selector */}
      <div className="space-y-2">
        <label className="text-[10px] uppercase tracking-widest text-[var(--color-text-muted)]">
          Server
        </label>
        <select
          value={selectedServer}
          onChange={(e) => {
            setSelectedServer(e.target.value)
            setSelectedTool('')
          }}
          className="w-full min-h-[44px] rounded border border-[var(--color-border)] bg-[var(--color-bg-card)] px-3 py-2 text-sm text-[var(--color-text-primary)] font-mono"
        >
          {topology?.servers.map((s) => (
            <option key={s.name} value={s.name}>
              {s.name} ({s.tools.length} tools)
            </option>
          ))}
        </select>
      </div>

      {/* No tools fallback */}
      {!loading && topology && (topology.servers.length === 0 || toolsForServer.length === 0) && (
        <div className="rounded border border-[var(--color-border)] bg-[var(--color-bg-panel)] p-4 text-center">
          <p className="font-mono text-xs text-[var(--color-text-muted)]">
            No tools available.
          </p>
          <p className="font-mono text-[10px] text-[var(--color-text-muted)] mt-1">
            Check <a href="https://config.superbots.link/api/mcp/topology" target="_blank" rel="noopener noreferrer" className="text-[var(--color-cyan)] hover:underline">config.superbots.link/api/mcp/topology</a> or docs.
          </p>
        </div>
      )}

      {/* Tool selector with search */}
      <div className="space-y-2">
        <label className="text-[10px] uppercase tracking-widest text-[var(--color-text-muted)]">
          Tool
        </label>
        <input
          type="search"
          placeholder="Search tools by name or description..."
          value={toolSearch}
          onChange={(e) => setToolSearch(e.target.value)}
          className="w-full min-h-[36px] rounded border border-[var(--color-border)] bg-[var(--color-bg-card)] px-3 py-2 text-sm text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] font-mono"
        />
        <select
          value={selectedTool}
          onChange={(e) => setSelectedTool(e.target.value)}
          className="w-full min-h-[44px] rounded border border-[var(--color-border)] bg-[var(--color-bg-card)] px-3 py-2 text-sm text-[var(--color-text-primary)] font-mono"
        >
          <option value="">Select a tool</option>
          {toolOptions.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
        {toolSearch && (
          <span className="text-[10px] text-[var(--color-text-muted)]">
            {filteredTools.length} of {toolsForServer.length} tools
          </span>
        )}
        {selectedTool && (() => {
          const server = topology?.servers.find((s) => s.name === selectedServer)
          const tool = server?.tools.find((t) => t.name === selectedTool)
          return tool?.description ? (
            <div className="mt-2 rounded border border-[var(--color-border)] bg-[var(--color-bg-panel)] p-2">
              <h3 className="text-[10px] uppercase tracking-widest text-[var(--color-text-muted)] mb-1">
                Guidelines
              </h3>
              <p className="text-xs text-[var(--color-text-secondary)]">{tool.description}</p>
            </div>
          ) : null
        })()}
      </div>

      {/* Agent suggestions */}
      {selectedTool && agentSuggestions.length > 0 && (
        <div className="rounded border border-[var(--color-border)] bg-[var(--color-bg-panel)] p-3">
          <h3 className="text-[10px] uppercase tracking-widest text-[var(--color-text-muted)] mb-2">
            Agent suggestions
          </h3>
          <ul className="space-y-1 text-xs text-[var(--color-text-secondary)]">
            {agentSuggestions.map((s, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-[var(--color-text-muted)]">•</span>
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* PKG context */}
      {selectedTool && (
        <div className="rounded border border-[var(--color-border)] bg-[var(--color-bg-panel)] p-3">
          <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
            <h3 className="text-[10px] uppercase tracking-widest text-[var(--color-text-muted)]">
              PKG context (pkg_hybrid){' '}
              {pkgLoading && <span className="text-[var(--color-text-muted)]">(loading…)</span>}
            </h3>
            <div className="flex items-center gap-2">
              {pkgContext?.snippets?.length ? (
                <>
                  <button
                    type="button"
                    onClick={() => setPkgExpanded(new Set(pkgContext.snippets.map((_, i) => i)))}
                    className="text-[10px] uppercase tracking-wider text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] transition-colors"
                  >
                    Expand all
                  </button>
                  <button
                    type="button"
                    onClick={() => setPkgExpanded(new Set())}
                    className="text-[10px] uppercase tracking-wider text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] transition-colors"
                  >
                    Collapse all
                  </button>
                </>
              ) : null}
              {pkgContext?.query && (
                <a
                  href={getPKGSearchPageURL(pkgContext.query, 20)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[10px] uppercase tracking-wider text-[var(--color-text-muted)] hover:text-[var(--color-cyan)] transition-colors"
                >
                  View all
                </a>
              )}
            </div>
          </div>
          {pkgContext?.snippets?.length ? (
            <div className="space-y-2 text-xs">
              {pkgContext.snippets.map((s, i) => {
                const expanded = pkgExpanded.has(i)
                const previewLen = 80
                const needsExpand = (s.content?.length ?? 0) > previewLen
                return (
                  <div
                    key={i}
                    className="rounded bg-[var(--color-bg-card)] border-l-2 border-[var(--color-border)] overflow-hidden"
                  >
                    <button
                      type="button"
                      onClick={() =>
                        setPkgExpanded((prev) => {
                          const next = new Set(prev)
                          if (next.has(i)) next.delete(i)
                          else next.add(i)
                          return next
                        })
                      }
                      className="w-full text-left p-2 hover:bg-[var(--color-bg-panel)] transition-colors flex items-start gap-2"
                    >
                      {needsExpand && (
                        <span className="text-[var(--color-text-muted)] shrink-0 mt-0.5">
                          {expanded ? '−' : '+'}
                        </span>
                      )}
                      <div className="min-w-0 flex-1">
                        {s.title && (
                          <div className="font-medium text-[var(--color-text-secondary)] mb-0.5">
                            {s.title}
                          </div>
                        )}
                        {s.content && (
                          <div className="text-[var(--color-text-muted)]">
                            {expanded || !needsExpand
                              ? s.content
                              : `${s.content.slice(0, previewLen)}…`}
                          </div>
                        )}
                      </div>
                    </button>
                  </div>
                )
              })}
            </div>
          ) : (
            !pkgLoading && (
              <p className="text-[var(--color-text-muted)] text-xs">
                No PKG docs found for this tool.
              </p>
            )
          )}
          {pkgContext?.snippets?.length && pkgContext.snippets.length >= pkgLimit && (
            <button
              type="button"
              onClick={handlePkgLoadMore}
              disabled={pkgLoading}
              className="mt-2 w-full py-1.5 text-[10px] uppercase tracking-wider text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] disabled:opacity-50 transition-colors border border-[var(--color-border)] rounded"
            >
              {pkgLoading ? 'Loading…' : 'Load more'}
            </button>
          )}
        </div>
      )}

      {/* Arguments */}
      <div className="space-y-2">
        <label className="text-[10px] uppercase tracking-widest text-[var(--color-text-muted)]">
          Arguments (JSON)
        </label>
        <textarea
          value={argsJson}
          onChange={(e) => setArgsJson(e.target.value)}
          rows={4}
          className="w-full rounded border border-[var(--color-border)] bg-[var(--color-bg-card)] px-3 py-2 text-sm font-mono text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)]"
          placeholder='{"query": "example", "topK": 5}'
        />
      </div>

      {/* Execute button */}
      <button
        onClick={handleExecute}
        disabled={executing || !selectedTool}
        className="min-h-[44px] w-full px-4 py-2 text-[10px] uppercase tracking-widest font-bold rounded bg-[var(--color-cyan)] hover:bg-[var(--color-cyan)]/80 disabled:opacity-50 text-[var(--color-bg-deep)]"
      >
        {executing ? 'Executing...' : 'Execute'}
      </button>

      {/* Error */}
      {error && (
        <div className="rounded border border-[var(--color-error)]/40 bg-[var(--color-error)]/10 p-3 text-[var(--color-error)] text-sm">
          {error}
        </div>
      )}

      {/* Result */}
      {lastResult && (
        <div className="space-y-4 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-panel)] p-4">
          {/* Result data */}
          <div>
            <h3 className="text-xs uppercase tracking-widest text-[var(--color-text-muted)] mb-2">
              Result
            </h3>
            <pre className="text-xs font-mono text-[var(--color-text-secondary)] overflow-auto max-h-48 rounded bg-[var(--color-bg-card)] p-3">
              {JSON.stringify(lastResult.result ?? lastResult.raw, null, 2)}
            </pre>
          </div>

          {/* Telemetry */}
          <div className="flex gap-4 text-[10px] uppercase tracking-wider text-[var(--color-text-muted)]">
            <span>Latency: {lastResult.latency}ms</span>
            <span>Status: {lastResult.statusCode}</span>
            <span>{lastResult.timestamp}</span>
          </div>

          {/* X-System */}
          {lastResult.xSystem != null && (
            <div>
              <button
                type="button"
                onClick={() => setShowXSystem(!showXSystem)}
                className="flex items-center gap-2 text-xs uppercase tracking-widest text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]"
              >
                {showXSystem ? '−' : '+'} X-System
              </button>
              {showXSystem && (
                <pre className="mt-2 text-[10px] font-mono text-[var(--color-text-muted)] overflow-auto max-h-32 rounded bg-[var(--color-bg-card)] p-2">
                  {typeof lastResult.xSystem === 'string'
                    ? lastResult.xSystem
                    : JSON.stringify(lastResult.xSystem, null, 2)}
                </pre>
              )}
            </div>
          )}

          {/* XBugger */}
          {lastResult.xBugger != null && (
            <div>
              <button
                type="button"
                onClick={() => setShowXBugger(!showXBugger)}
                className="flex items-center gap-2 text-xs uppercase tracking-widest text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]"
              >
                {showXBugger ? '−' : '+'} XBugger
              </button>
              {showXBugger && (
                <div className="mt-2 space-y-2">
                  {lastResult.xBugger.analysis != null && (
                    <pre className="text-[10px] font-mono text-[var(--color-amber)] overflow-auto max-h-24 rounded bg-[var(--color-bg-card)] p-2">
                      {typeof lastResult.xBugger.analysis === 'string'
                        ? lastResult.xBugger.analysis
                        : JSON.stringify(lastResult.xBugger.analysis, null, 2)}
                    </pre>
                  )}
                  {lastResult.xBugger.logs != null && (
                    <pre className="text-[10px] font-mono text-[var(--color-text-muted)] overflow-auto max-h-24 rounded bg-[var(--color-bg-card)] p-2">
                      {typeof lastResult.xBugger.logs === 'string'
                        ? lastResult.xBugger.logs
                        : JSON.stringify(lastResult.xBugger.logs, null, 2)}
                    </pre>
                  )}
                </div>
              )}
            </div>
          )}

          {/* AI Insights */}
          {lastResult.aiInsights != null && (
            <div>
              <h3 className="text-xs uppercase tracking-widest text-[var(--color-text-muted)] mb-2">
                AI Insights
              </h3>
              <pre className="text-[10px] font-mono text-[var(--color-success)] overflow-auto max-h-24 rounded bg-[var(--color-bg-card)] p-2">
                {typeof lastResult.aiInsights === 'string'
                  ? lastResult.aiInsights
                  : JSON.stringify(lastResult.aiInsights, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
