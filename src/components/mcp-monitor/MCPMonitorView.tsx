/**
 * pow3r.control - MCP Monitoring View
 *
 * Purpose:
 * - Monitor MCP server health and tool counts
 * - Click to expand: list tools with description
 * - Signal button pings tool; LED shows status (hover for label)
 */
import { useState, useEffect } from 'react'
import { pingMCP, callMCPTool } from '../../lib/mcp-playground-api'

const API_BASE = 'https://config.superbots.link'

interface ToolInfo {
  name: string
  description?: string
}

interface ServerInfo {
  id: string
  name: string
  toolCount: number
  status: string
  tools: ToolInfo[]
}

function StatusLED({ status, title }: { status: 'ok' | 'fail' | 'pending'; title: string }) {
  const color =
    status === 'ok' ? 'var(--color-success)' : status === 'fail' ? 'var(--color-error)' : 'var(--color-text-muted)'
  const label = status === 'ok' ? 'Connected' : status === 'fail' ? 'Failed' : 'Pending'
  return (
    <span
      className="w-2 h-2 rounded-full shrink-0 inline-block"
      style={{ backgroundColor: color }}
      title={title || label}
      aria-label={title || label}
    />
  )
}

export function MCPMonitorView() {
  const [servers, setServers] = useState<ServerInfo[]>([])
  const [totalTools, setTotalTools] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [pingStatus, setPingStatus] = useState<Record<string, 'ok' | 'fail' | 'pending'>>({})
  const [toolPingStatus, setToolPingStatus] = useState<Record<string, 'ok' | 'fail' | 'pending'>>({})

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
          const tools: ToolInfo[] = Array.isArray(s.tools)
            ? (s.tools as Record<string, unknown>[]).map((t) => ({
                name: String(t.name ?? ''),
                description: t.description ? String(t.description) : undefined,
              }))
            : []
          let toolCount = Number(s.toolCount ?? s.tool_count ?? 0)
          if (toolCount === 0) toolCount = tools.length
          return {
            id: String(s.id ?? s.name ?? ''),
            name: String(s.name ?? s.id ?? ''),
            toolCount,
            status: String(s.status ?? 'unknown'),
            tools,
          }
        })
        const total = data.metadata?.totalTools ?? servers.reduce((sum, s) => sum + s.toolCount, 0)
        setServers(servers)
        setTotalTools(total)
      })
      .catch((err) => setError(err?.message ?? 'Failed to load'))
      .finally(() => setLoading(false))
  }

  const handlePing = async (serverId: string) => {
    setPingStatus((prev) => ({ ...prev, [serverId]: 'pending' }))
    const result = await pingMCP()
    setPingStatus((prev) => ({ ...prev, [serverId]: result.ok ? 'ok' : 'fail' }))
  }

  const handleToolPing = async (serverName: string, toolName: string) => {
    const key = `${serverName}:${toolName}`
    setToolPingStatus((prev) => ({ ...prev, [key]: 'pending' }))
    try {
      const result = await callMCPTool(serverName, toolName, {})
      setToolPingStatus((prev) => ({ ...prev, [key]: result.ok ? 'ok' : 'fail' }))
    } catch {
      setToolPingStatus((prev) => ({ ...prev, [key]: 'fail' }))
    }
  }

  useEffect(() => {
    fetchTopology()
  }, [])

  return (
    <div className="p-4 space-y-4">
      <h2 className="font-mono text-sm font-semibold text-[var(--color-cyan)]">MCP Monitor</h2>
      <p className="font-mono text-[10px] text-[var(--color-text-muted)]">
        Click a server to expand. LED: green=connected, red=failed, gray=pending. Hover LED for status.
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
          <div className="space-y-2" style={{ maxWidth: 520 }}>
            {servers.slice(0, 24).map((s) => {
              const isExpanded = expandedId === s.id
              const ping = pingStatus[s.id]
              return (
                <div
                  key={s.id}
                  className="rounded border border-[var(--color-border)] bg-[var(--color-bg-card)] overflow-hidden"
                >
                  <div className="flex items-center gap-2 p-2">
                    <button
                      type="button"
                      onClick={() => setExpandedId(isExpanded ? null : s.id)}
                      className="flex-1 flex items-center gap-2 text-left hover:bg-[var(--color-bg-panel)] transition-colors rounded"
                    >
                      <StatusLED
                        status={ping ?? 'pending'}
                        title={ping === 'ok' ? 'Connection OK' : ping === 'fail' ? 'Connection failed' : 'Click signal to ping'}
                      />
                      <span className="text-[var(--color-cyan)] font-mono text-[10px]">{s.name}</span>
                      <span className="ml-2 text-[var(--color-text-muted)] font-mono text-[10px]">
                        {s.toolCount} tools
                      </span>
                      <span className="ml-auto text-[var(--color-text-muted)]">{isExpanded ? '−' : '+'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); handlePing(s.id) }}
                      className="shrink-0 px-1.5 py-0.5 rounded border border-[var(--color-border)] text-[9px] hover:bg-[var(--color-bg-panel)]"
                      title="Ping MCP gateway"
                    >
                      signal
                    </button>
                  </div>
                  {isExpanded && (
                    <div className="border-t border-[var(--color-border)] p-2 space-y-1">
                      {s.tools.length === 0 ? (
                        <p className="font-mono text-[10px] text-[var(--color-text-muted)]">No tools listed</p>
                      ) : (
                        s.tools.map((t) => {
                          const key = `${s.name}:${t.name}`
                          const toolPing = toolPingStatus[key]
                          return (
                            <div
                              key={t.name}
                              className="flex items-center gap-2 py-1 font-mono text-[10px]"
                            >
                              <StatusLED
                                status={toolPing ?? 'pending'}
                                title={toolPing === 'ok' ? 'Tool OK' : toolPing === 'fail' ? 'Tool failed' : 'Click signal to ping'}
                              />
                              <button
                                type="button"
                                onClick={() => handleToolPing(s.name, t.name)}
                                className="shrink-0 px-1.5 py-0.5 rounded border border-[var(--color-border)] text-[9px] hover:bg-[var(--color-bg-panel)]"
                                title="Ping this tool"
                              >
                                signal
                              </button>
                              <span className="text-[var(--color-text-secondary)]">{t.name}</span>
                              {t.description && (
                                <span className="text-[var(--color-text-muted)] truncate flex-1" title={t.description}>
                                  {t.description}
                                </span>
                              )}
                            </div>
                          )
                        })
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
