/**
 * pow3r.control - Workflow Library API
 *
 * Purpose:
 * - Fetch workflows from config.superbots.link workflow library
 * - GET /api/workflow/list or POST /mcp/workflow-library/tools/call
 */
const API_BASE = 'https://config.superbots.link'

export interface WorkflowListItem {
  id: string
  workflowId?: string
  name?: string
  description?: string
  version?: string
  workflow_type?: string
  tags?: string[]
  lastRun?: string | null
}

export interface WorkflowListResponse {
  workflows: WorkflowListItem[]
  count?: number
}

/** Fetch workflow list from GET /api/workflow/list */
export async function fetchWorkflowList(): Promise<WorkflowListResponse> {
  try {
    const res = await fetch(`${API_BASE}/api/workflow/list`)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const json = await res.json()
    const data = json.data ?? json
    const workflows = Array.isArray(data.workflows) ? data.workflows : []
    return {
      workflows: workflows.map((w: Record<string, unknown>) => ({
        id: String(w.id ?? w.workflowId ?? w.workflow_id ?? ''),
        workflowId: String(w.workflowId ?? w.workflow_id ?? w.id ?? ''),
        name: String(w.name ?? w.title ?? w.id ?? ''),
        description: w.description ? String(w.description) : undefined,
        version: w.version ? String(w.version) : undefined,
        workflow_type: w.workflow_type ? String(w.workflow_type) : undefined,
        tags: Array.isArray(w.tags) ? w.tags.map(String) : undefined,
        lastRun: w.lastRun ?? null,
      })),
      count: workflows.length,
    }
  } catch (err) {
    console.warn('[workflow-library-api] fetchWorkflowList failed:', err)
    return { workflows: [], count: 0 }
  }
}

/** Fetch workflows via workflow_library_list MCP tool */
export async function fetchWorkflowListViaMCP(options?: { limit?: number; category?: string; tag?: string }): Promise<WorkflowListResponse> {
  try {
    const res = await fetch(`${API_BASE}/mcp/workflow-library/tools/call`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 'wl-1',
        method: 'tools/call',
        params: {
          name: 'workflow_library_list',
          arguments: { limit: options?.limit ?? 200, category: options?.category, tag: options?.tag },
        },
      }),
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const json = await res.json()
    const list = json.data?.workflows ?? json.result?.workflows ?? json.workflows ?? []
    return {
      workflows: list.map((w: Record<string, unknown>) => ({
        id: String(w.id ?? w.workflowId ?? ''),
        workflowId: String(w.workflowId ?? w.id ?? ''),
        name: String(w.name ?? w.title ?? w.id ?? ''),
        description: w.description ? String(w.description) : undefined,
        version: w.version ? String(w.version) : undefined,
        workflow_type: w.type ?? w.workflow_type,
        tags: Array.isArray(w.tags) ? w.tags.map(String) : undefined,
        lastRun: w.lastRun ?? null,
      })),
      count: list.length,
    }
  } catch (err) {
    console.warn('[workflow-library-api] fetchWorkflowListViaMCP failed:', err)
    return { workflows: [], count: 0 }
  }
}

/** Fetch from GET /api/workflow-library/list (HTTP, not MCP) */
function inferCategory(w: Record<string, unknown>): string {
  const meta = (w.metadata ?? {}) as Record<string, unknown>
  if (meta.category) return String(meta.category)
  if (w.type) return String(w.type)

  const tags = Array.isArray(meta.tags) ? meta.tags.map(String) : []
  if (tags.includes('media-generation') || tags.includes('media')) return 'media'
  if (tags.includes('testing') || tags.includes('test')) return 'testing'
  if (tags.includes('deployment') || tags.includes('deploy')) return 'deployment'
  if (tags.includes('migration')) return 'migration'

  const id = String(w.id ?? w.workflowId ?? '').toLowerCase()
  if (id.includes('media') || id.includes('voice') || id.includes('audio') || id.includes('video') || id.includes('image')) return 'media'
  if (id.includes('test') || id.includes('validation') || id.includes('validate')) return 'testing'
  if (id.includes('deploy') || id.includes('pages-deploy')) return 'deployment'
  if (id.includes('migrate') || id.includes('migration') || id.includes('upgrade')) return 'migration'
  if (id.includes('heal') || id.includes('repair') || id.includes('fix')) return 'self-heal'
  if (id.includes('ingest') || id.includes('sync') || id.includes('bootstrap')) return 'data-pipeline'
  if (id.includes('kg') || id.includes('pkg') || id.includes('knowledge')) return 'knowledge'
  if (id.includes('agent') || id.includes('abi') || id.includes('jaime') || id.includes('maxi')) return 'agents'

  return 'workflow'
}

export async function fetchWorkflowLibraryHTTP(options?: { limit?: number; category?: string }): Promise<WorkflowListResponse> {
  try {
    const params = new URLSearchParams()
    if (options?.limit) params.set('limit', String(options.limit))
    if (options?.category) params.set('category', options.category)
    const res = await fetch(`${API_BASE}/api/workflow-library/list?${params}`)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const json = await res.json()
    const data = json.data ?? json
    const workflows = Array.isArray(data.workflows) ? data.workflows : []
    return {
      workflows: workflows.map((w: Record<string, unknown>) => ({
        id: String(w.id ?? w.workflowId ?? ''),
        workflowId: String(w.workflowId ?? w.id ?? ''),
        name: String(w.name ?? w.title ?? w.id ?? ''),
        description: w.description ? String(w.description) : undefined,
        version: w.version ? String(w.version) : undefined,
        workflow_type: inferCategory(w),
        tags: Array.isArray((w.metadata as Record<string, unknown>)?.tags) ? ((w.metadata as Record<string, unknown>).tags as string[]).map(String) : undefined,
        lastRun: w.lastRun ?? null,
      })),
      count: data.count ?? workflows.length,
    }
  } catch (err) {
    console.warn('[workflow-library-api] fetchWorkflowLibraryHTTP failed:', err)
    return { workflows: [], count: 0 }
  }
}

/** Fetch workflows: HTTP library first, then MCP, then legacy /api/workflow/list */
export async function fetchWorkflowsCombined(): Promise<WorkflowListResponse> {
  const http = await fetchWorkflowLibraryHTTP({ limit: 200 })
  if (http.workflows.length > 0) return http
  const mcp = await fetchWorkflowListViaMCP({ limit: 200 })
  if (mcp.workflows.length > 0) return mcp
  return fetchWorkflowList()
}

/** Fetch full workflow definition via HTTP API (avoids MCP PKG requirement) */
export async function fetchWorkflowView(workflowId: string, _version?: string): Promise<Record<string, unknown> | null> {
  try {
    const res = await fetch(`${API_BASE}/api/workflow-library/view/${encodeURIComponent(workflowId)}`)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const json = await res.json()
    const workflow = json.data?.workflow ?? json.workflow ?? null
    return workflow && typeof workflow === 'object' ? (workflow as Record<string, unknown>) : null
  } catch (err) {
    console.warn('[workflow-library-api] fetchWorkflowView failed:', err)
    return null
  }
}
