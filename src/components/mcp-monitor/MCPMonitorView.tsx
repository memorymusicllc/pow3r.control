/**
 * pow3r.control - MCP Monitoring View
 *
 * Purpose:
 * - Monitor MCP server health and tool counts
 * - Data from /api/mcp/topology
 */
import { useState, useEffect } from 'react'

const API_BASE = 'https://config.superbots.link'

interface ServerInfo {
  id: string
  name: string
  toolCount: number
  status: string
}

export function MCPMonitorView() {
  const [servers, setServers] = useState<ServerInfo[]>([])
  const [totalTools, setTotalTools] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchTopology = () => {
    setLoading(true)
    setError(null)
    fetch(`${API_BASE}/api/mcp/topology`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json()
      })
      .then((json) => {
        const data = json?.data ?? json
        const rawServers = data.servers ?? []
        const servers: ServerInfo[] = rawServers.map((s: Record<string, unknown>) => {
          let toolCount = Number(s.toolCount ?? s.tool_count ?? 0)
          if (toolCount === 0 && Array.isArray(s.tools)) toolCount = s.tools.length
          return {
            id: String(s.id ?? s.name ?? ''),
            name: String(s.name ?? s.id ?? ''),
            toolCount,
            status: String(s.status ?? 'unknown'),
          }
        })
        const total = data.metadata?.totalTools ?? servers.reduce((sum, s) => sum + s.toolCount, 0)
        setServers(servers)
        setTotalTools(total)
      })
      .catch((err) => setError(err?.message ?? 'Failed to load'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchTopology()
  }, [])

  return (
    <div className="p-4 space-y-4">
      <h2 className="font-mono text-sm font-semibold text-[var(--color-cyan)]">MCP Monitor</h2>
      <p className="font-mono text-[10px] text-[var(--color-text-muted)]" title="Config selector applies to graph/dashboard views">
        Global topology (all deployed servers). Config selector applies to graph/dashboard views.
      </p>
      {loading && <p className="font-mono text-[10px] text-[var(--color-text-muted)]">Loading topology...</p>}
      {error && <p className="font-mono text-[10px] text-[var(--color-error)]">{error}</p>}
      {!loading && !error && (
        <>
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <p className="font-mono text-[10px] text-[var(--color-text-muted)]">
              {servers.length} servers, {totalTools} tools
            </p>
            <button
              onClick={fetchTopology}
              disabled={loading}
              className="font-mono text-[10px] px-2 py-1 rounded bg-[var(--color-bg-card)] border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-panel)] min-h-[44px] min-w-[44px]"
              title="Refresh topology"
            >
              Refresh
            </button>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3" style={{ maxWidth: 520 }}>
            {servers.slice(0, 24).map((s) => (
              <div
                key={s.id}
                className="p-2 rounded border border-[var(--color-border)] bg-[var(--color-bg-card)] font-mono text-[10px]"
                title={`${s.name}: ${s.toolCount} tools`}
              >
                <span className="text-[var(--color-cyan)]">{s.name}</span>
                <span className="ml-2 text-[var(--color-text-muted)]">
                  {s.toolCount} tools
                  {s.toolCount === 0 && (
                    <a
                      href="https://config.superbots.link/docs"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-1 text-[var(--color-amber)] hover:underline"
                    >
                      (docs)
                    </a>
                  )}
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
