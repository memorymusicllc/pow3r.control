/**
 * pow3r.control - PDAM View (Projects, Assets, Data)
 *
 * Purpose:
 * - View/manage PDAM projects and assets
 * - Asset viewer: grid of assets with preview/type
 * - Data from config.superbots.link PDAM API
 */
import { useState, useEffect } from 'react'

const API_BASE = 'https://config.superbots.link'

interface PDAMAsset {
  id?: string
  r2_key?: string
  filename?: string
  asset_type?: string
  title?: string
  created_at?: string
  date?: string
  signed_url?: string
}

export function PDAMView() {
  const [projects, setProjects] = useState<Array<{ id: string; name: string }>>([])
  const [assets, setAssets] = useState<PDAMAsset[]>([])
  const [loading, setLoading] = useState(true)
  const [assetsLoading, setAssetsLoading] = useState(false)
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

  useEffect(() => {
    let cancelled = false
    setAssetsLoading(true)
    fetch(`${API_BASE}/api/pdam/assets?limit=50`).then((res) => {
      if (cancelled) return
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      return res.json()
    }).then((json) => {
      if (cancelled) return
      const list = json?.data?.assets ?? json?.assets ?? []
      setAssets(Array.isArray(list) ? list : [])
    }).catch(() => {
      if (!cancelled) setAssets([])
    }).finally(() => {
      if (!cancelled) setAssetsLoading(false)
    })
    return () => { cancelled = true }
  }, [])

  return (
    <div className="px-5 py-4 space-y-6">
      <h2 className="font-mono text-sm font-semibold text-[var(--color-cyan)]">PDAM - Projects & Assets</h2>
      {loading && <p className="font-mono text-[10px] text-[var(--color-text-muted)]">Loading...</p>}
      {error && <p className="font-mono text-[10px] text-[var(--color-error)]">{error}</p>}

      {/* Projects */}
      <div>
        <h3 className="font-mono text-[10px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-2">
          Projects
        </h3>
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
                className="px-4 py-3 rounded border border-[var(--color-border)] bg-[var(--color-bg-card)] font-mono text-[10px]"
              >
                <span className="text-[var(--color-cyan)]">{p.name ?? p.id}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Asset viewer */}
      <div>
        <h3 className="font-mono text-[10px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-2">
          Asset Viewer ({assets.length})
        </h3>
        {assetsLoading && <p className="font-mono text-[10px] text-[var(--color-text-muted)]">Loading assets...</p>}
        {!assetsLoading && assets.length === 0 && (
          <p className="font-mono text-[10px] text-[var(--color-text-muted)]">
            No assets. Upload via Writer or PDAM API.
          </p>
        )}
        {!assetsLoading && assets.length > 0 && (
          <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-4" style={{ maxWidth: 520 }}>
            {assets.slice(0, 24).map((a, i) => (
              <div
                key={a.id ?? a.r2_key ?? i}
                className="rounded border border-[var(--color-border)] bg-[var(--color-bg-card)] overflow-hidden"
              >
                <div className="aspect-square bg-[var(--color-bg-panel)] flex items-center justify-center p-2">
                  {a.asset_type === 'image' ? (
                    <img
                      src={a.signed_url ?? `${API_BASE}/api/pdam/assets/${encodeURIComponent(a.r2_key ?? '')}`}
                      alt={a.title ?? a.filename ?? 'Asset'}
                      className="max-w-full max-h-full object-contain"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none'
                      }}
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center gap-1">
                      <span className="text-[var(--color-text-muted)] text-[10px] font-mono">
                        {a.asset_type ?? 'file'}
                      </span>
                      {a.signed_url && (
                        <a
                          href={a.signed_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[10px] font-mono text-[var(--color-cyan)] hover:underline"
                        >
                          View
                        </a>
                      )}
                    </div>
                  )}
                </div>
                <div className="px-2 py-1.5 font-mono text-[9px] text-[var(--color-text-secondary)] truncate" title={a.filename ?? a.title}>
                  {a.filename ?? a.title ?? a.r2_key ?? 'Asset'}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
