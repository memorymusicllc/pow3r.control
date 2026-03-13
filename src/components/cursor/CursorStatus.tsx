/**
 * pow3r.control - Cursor Components Status
 *
 * Purpose:
 * - Rule compliance from X-Plugin observations (live)
 * - MCP connection health from /api/mcp/health
 */
import { useState, useEffect } from 'react'
import { api } from '../../lib/api-client'

interface HealthItem { name: string; status: string }

export function CursorStatus() {
  const [mcpHealth, setMcpHealth] = useState<HealthItem[]>([])
  const [observations, setObservations] = useState<Array<{ type: string; message: string; timestamp: string }>>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    (async () => {
      const [healthRes, obsRes] = await Promise.all([
        api.get<{ services: HealthItem[] }>('/api/mcp/health'),
        api.get<{ events: Array<{ type: string; message: string; timestamp: string }> }>('/mcp/x-plugin/observations?count=10&type=info'),
      ])
      if (healthRes.success && healthRes.data) {
        const svcs = healthRes.data.services || Object.entries(healthRes.data).filter(([k]) => k !== 'timestamp').map(([k, v]) => ({ name: k, status: (v as { status?: string })?.status || String(v) }))
        setMcpHealth(Array.isArray(svcs) ? svcs : [])
      }
      if (obsRes.success && obsRes.data) {
        const evts = obsRes.data.events || (Array.isArray(obsRes.data) ? obsRes.data : [])
        setObservations(evts.slice(0, 10))
      }
      setLoading(false)
    })()
  }, [])

  const enforcerChecks = [
    { id: 'pkg', label: 'PKG query before task', status: observations.some((o) => o.message?.includes('pkg') || o.type === 'pkg_query') ? 'pass' : 'pending' },
    { id: 'xplugin', label: 'X-Plugin observation logged', status: observations.length > 0 ? 'pass' : 'pending' },
    { id: 'mcp', label: 'MCP services healthy', status: mcpHealth.some((s) => s.status === 'ok' || s.status === 'healthy') ? 'pass' : 'pending' },
  ]

  return (
    <div className="p-4 space-y-4">
      <h4 className="font-mono text-[10px] font-semibold text-[var(--color-text-muted)] uppercase">Enforcer Protocol</h4>
      {loading && <p className="font-mono text-[9px] text-[var(--color-text-muted)]">Loading...</p>}
      <div className="space-y-1">
        {enforcerChecks.map((item) => (
          <div key={item.id} className="flex items-center gap-2 p-2 rounded bg-[var(--color-bg-card)] border border-[var(--color-border)]">
            <div className={`w-2 h-2 rounded-full ${item.status === 'pass' ? 'bg-[var(--color-success)]' : 'bg-[var(--color-amber)]'}`} />
            <span className="font-mono text-[10px]">{item.label}</span>
          </div>
        ))}
      </div>

      <h4 className="font-mono text-[10px] font-semibold text-[var(--color-text-muted)] uppercase">MCP Health</h4>
      <div className="space-y-1">
        {mcpHealth.map((svc) => (
          <div key={svc.name} className="flex items-center gap-2 px-3 py-1.5 rounded bg-[var(--color-bg-card)] border border-[var(--color-border)]">
            <div className={`w-2 h-2 rounded-full ${svc.status === 'ok' || svc.status === 'healthy' ? 'bg-[var(--color-success)]' : 'bg-[var(--color-error)]'}`} />
            <span className="font-mono text-[10px]">{svc.name}</span>
            <span className="font-mono text-[8px] text-[var(--color-text-muted)] ml-auto">{svc.status}</span>
          </div>
        ))}
      </div>

      {observations.length > 0 && (
        <>
          <h4 className="font-mono text-[10px] font-semibold text-[var(--color-text-muted)] uppercase">Recent Observations</h4>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {observations.map((obs, i) => (
              <div key={i} className="px-3 py-1.5 rounded bg-[var(--color-bg-card)] border border-[var(--color-border)] font-mono text-[9px] text-[var(--color-text-secondary)]">
                {obs.message}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
