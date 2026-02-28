/**
 * pow3r.control - MCP Playground API
 *
 * Purpose:
 * - Fetch MCP topology (servers + tools)
 * - Execute MCP tool calls via playground endpoint
 * - Fetch PKG context via hybrid search
 *
 * Agent Instructions:
 * - All calls go to config.superbots.link
 * - Used by MCPPlayground component
 */

const API_BASE = 'https://config.superbots.link'

export interface MCPTool {
  name: string
  description?: string
  inputSchema?: Record<string, unknown>
}

export interface MCPServer {
  name: string
  tools: MCPTool[]
  status?: string
}

export interface MCPTopology {
  servers: MCPServer[]
  totalTools: number
}

export interface PlaygroundCallResult {
  tool: string
  arguments: Record<string, unknown>
  latency: number
  statusCode: number
  ok: boolean
  result: unknown
  raw: { error?: unknown } | null
  timestamp: string
  telemetry: { xPluginObs: string | null; durationMs: number }
  xSystem: unknown
  xBugger: { logs?: unknown[]; analysis?: unknown } | null
  aiInsights: unknown
}

export interface PKGSnippet {
  title?: string
  content?: string
  nodeId?: string
  score?: number
  hybridSource?: string
}

export interface PKGContextResult {
  query: string
  snippets: PKGSnippet[]
}

/** Fetch MCP topology from config.superbots.link */
export async function fetchMCPTopology(): Promise<MCPTopology> {
  try {
    const res = await fetch(`${API_BASE}/api/mcp/topology`)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const json = await res.json()
    const data = json.data ?? json
    const servers: MCPServer[] = Array.isArray(data.servers)
      ? data.servers.map((s: Record<string, unknown>) => ({
          name: String(s.name ?? ''),
          tools: Array.isArray(s.tools)
            ? s.tools.map((t: Record<string, unknown>) => ({
                name: String(t.name ?? ''),
                description: t.description ? String(t.description) : undefined,
                inputSchema: t.inputSchema as Record<string, unknown> | undefined,
              }))
            : [],
          status: s.status ? String(s.status) : undefined,
        }))
      : []
    return {
      servers,
      totalTools: servers.reduce((acc, s) => acc + s.tools.length, 0),
    }
  } catch (err) {
    console.warn('[mcp-playground-api] fetchMCPTopology failed:', err)
    return { servers: [], totalTools: 0 }
  }
}

/** Execute MCP tool call via playground endpoint */
export async function callMCPTool(
  server: string,
  tool: string,
  args: Record<string, unknown>
): Promise<PlaygroundCallResult> {
  const start = Date.now()
  try {
    const res = await fetch(`${API_BASE}/api/mcp/playground/call`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ server, tool, arguments: args }),
    })
    const latency = Date.now() - start
    const json = await res.json()
    const data = json.data ?? json
    return {
      tool,
      arguments: args,
      latency,
      statusCode: res.status,
      ok: res.ok && (data.success !== false),
      result: data.result ?? data,
      raw: json,
      timestamp: new Date().toISOString(),
      telemetry: {
        xPluginObs: data.xPluginObs ?? null,
        durationMs: latency,
      },
      xSystem: data.xSystem ?? null,
      xBugger: data.xBugger ?? null,
      aiInsights: data.aiInsights ?? null,
    }
  } catch (err) {
    const latency = Date.now() - start
    return {
      tool,
      arguments: args,
      latency,
      statusCode: 0,
      ok: false,
      result: null,
      raw: { error: err instanceof Error ? err.message : String(err) },
      timestamp: new Date().toISOString(),
      telemetry: { xPluginObs: null, durationMs: latency },
      xSystem: null,
      xBugger: null,
      aiInsights: null,
    }
  }
}

/** Fetch PKG context via hybrid search */
export async function fetchPKGContext(query: string, limit = 10): Promise<PKGContextResult> {
  try {
    const res = await fetch(
      `${API_BASE}/api/search?q=${encodeURIComponent(query)}&source=pkg_hybrid&limit=${limit}`
    )
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const json = await res.json()
    const data = json.data ?? json
    const results = data.results ?? []
    const snippets: PKGSnippet[] = results
      .map((r: Record<string, unknown>) => {
        const content = String(r.content ?? r.text ?? '')
        const fallback = [
          r.nodeId,
          r.score != null ? `score: ${r.score}` : '',
          r.hybridSource,
        ]
          .filter(Boolean)
          .join(' ')
        return {
          title: r.title ? String(r.title) : r.id ? String(r.id) : r.nodeId ? String(r.nodeId) : undefined,
          content: content || fallback,
          nodeId: r.nodeId ? String(r.nodeId) : undefined,
          score: typeof r.score === 'number' ? r.score : undefined,
          hybridSource: r.hybridSource ? String(r.hybridSource) : undefined,
        }
      })
      .filter((s: PKGSnippet) => s.title || s.content)
    return { query, snippets }
  } catch (err) {
    console.warn('[mcp-playground-api] fetchPKGContext failed:', err)
    return { query, snippets: [] }
  }
}

/** Get PKG search page URL for "View all" link */
export function getPKGSearchPageURL(query: string, limit = 20): string {
  return `${API_BASE}/pkg-search?q=${encodeURIComponent(query)}&source=pkg_hybrid&limit=${limit}`
}
