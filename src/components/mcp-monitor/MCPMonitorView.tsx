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

  useEffect(() => {
    let cancelled = false
    fetch(`${API_BASE}/api/mcp/topology`).then((res) => {
      if (cancelled) return
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      return res.json()
    }).then((json) => {
      if (cancelled) return
      const data = json?.data ?? json
      setServers(data.servers ?? [])
      setTotalTools(data.metadata?.totalTools ?? 0)
    }).catch((err) => {
      if (!cancelled) setError(err?.message ?? 'Failed to load')
    }).finally(() => {
      if (!cancelled) setLoading(false)
    })
    return () => { cancelled = true }
  }, [])

  return (
    <div className="p-4 space-y-4">
      <h2 className="font-mono text-sm font-semibold text-[var(--color-cyan)]">MCP Monitor</h2>
      {loading && <p className="font-mono text-[10px] text-[var(--color-text-muted)]">Loading topology...</p>}
      {error && <p className="font-mono text-[10px] text-[var(--color-error)]">{error}</p>}
      {!loading && !error && (
        <>
          <p className="font-mono text-[10px] text-[var(--color-text-muted)]">
            {servers.length} servers, {totalTools} tools
          </p>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3" style={{ maxWidth: 520 }}>
            {servers.slice(0, 24).map((s) => (
              <div
                key={s.id}
                className="p-2 rounded border border-[var(--color-border)] bg-[var(--color-bg-card)] font-mono text-[10px]"
              >
                <span className="text-[var(--color-cyan)]">{s.name}</span>
                <span className="ml-2 text-[var(--color-text-muted)]">{s.toolCount} tools</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
