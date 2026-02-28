/**
 * pow3r.control - PDAM View (Projects, Assets, Data)
 *
 * Purpose:
 * - View/manage PDAM projects and assets
 * - Data from config.superbots.link PDAM API
 */
import { useState, useEffect } from 'react'

const API_BASE = 'https://config.superbots.link'

export function PDAMView() {
  const [projects, setProjects] = useState<Array<{ id: string; name: string }>>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    fetch(`${API_BASE}/api/pdam/projects`).then((res) => {
      if (cancelled) return
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      return res.json()
    }).then((json) => {
      if (cancelled) return
      const list = json?.data?.projects ?? json?.projects ?? []
      setProjects(Array.isArray(list) ? list : [])
    }).catch((err) => {
      if (!cancelled) setError(err?.message ?? 'Failed to load')
    }).finally(() => {
      if (!cancelled) setLoading(false)
    })
    return () => { cancelled = true }
  }, [])

  return (
    <div className="p-4 space-y-4">
      <h2 className="font-mono text-sm font-semibold text-[var(--color-cyan)]">PDAM - Projects & Assets</h2>
      {loading && <p className="font-mono text-[10px] text-[var(--color-text-muted)]">Loading...</p>}
      {error && <p className="font-mono text-[10px] text-[var(--color-error)]">{error}</p>}
      {!loading && !error && projects.length === 0 && (
        <p className="font-mono text-[10px] text-[var(--color-text-muted)]">
          No projects. PDAM API at /api/pdam/projects.
        </p>
      )}
      {projects.length > 0 && (
        <div className="grid gap-2 sm:grid-cols-2" style={{ maxWidth: 520 }}>
          {projects.map((p) => (
            <div
              key={p.id}
              className="p-3 rounded border border-[var(--color-border)] bg-[var(--color-bg-card)] font-mono text-[10px]"
            >
              <span className="text-[var(--color-cyan)]">{p.name ?? p.id}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
