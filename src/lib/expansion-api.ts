/**
 * pow3r.control - Expansion Data API
 *
 * Purpose:
 * - Fetches expansion data for recursive node drill-down
 * - XMAP sub-nodes (from edges), workflows referencing node, MCP tools, X-System events
 * - Used by NodeExpansionProvider, ExpandedNodeView, and in-graph compound expansion
 *
 * Agent Instructions:
 * - resolveChildrenForNode checks local config edges first (no network call)
 * - Falls back to remote API for cross-config expansion (repo-level nodes)
 * - Results should be cached in the store's expansionCache
 */
import type { XmapNode, XmapEdge, XmapWorkflow, XmapV7Config } from './types'
import type { XStreamEvent } from './x-system-types'

const API_BASE = 'https://config.superbots.link/api'

/** Fetch expansion subgraph from API (Deep Expansion) */
export async function fetchExpansionSubgraph(nodeId: string): Promise<{ nodes: XmapNode[]; edges: XmapEdge[]; rootNodeId?: string } | null> {
  try {
    const res = await fetch(`${API_BASE}/expansion/subgraph/${nodeId}`)
    if (!res.ok) return null
    const json = await res.json()
    if (!json.success || !json.data) return null
    return json.data
  } catch {
    return null
  }
}

/** Fetch expansion failures from API (Deep Expansion) */
export async function fetchExpansionFailures(nodeId: string): Promise<{ nodeFailures: any[]; edgeFailures: any[]; xFilesCases: any[] } | null> {
  try {
    const res = await fetch(`${API_BASE}/expansion/failures/${nodeId}`)
    if (!res.ok) return null
    const json = await res.json()
    if (!json.success || !json.data) return null
    return json.data
  } catch {
    return null
  }
}

/**
 * Resolve children for a node, checking local config first then remote API.
 *
 * Local resolution: finds nodes connected via outgoing edges from the parent.
 * Remote resolution: fetches sub-graph from expansion API for cross-config nodes.
 *
 * Returns null if the node has no expandable children.
 */
export async function resolveChildrenForNode(
  config: XmapV7Config | null,
  nodeId: string,
): Promise<{ nodes: XmapNode[]; edges: XmapEdge[] } | null> {
  // Try local resolution first: find nodes connected by outgoing edges from this parent
  if (config) {
    const localResult = getLocalChildren(config, nodeId)
    if (localResult.nodes.length > 0) {
      return localResult
    }
  }

  // Fall back to remote API for repo-level / cross-config expansion
  const remoteResult = await fetchExpansionSubgraph(nodeId)
  if (remoteResult && remoteResult.nodes.length > 0) {
    return { nodes: remoteResult.nodes, edges: remoteResult.edges }
  }

  return null
}

/**
 * Get children from the local config by examining outgoing edges.
 * A child is a node reached via an outgoing edge from the parent where the
 * parent is the `from_node`. Includes all edges among those children.
 */
export function getLocalChildren(
  config: XmapV7Config,
  nodeId: string,
): { nodes: XmapNode[]; edges: XmapEdge[] } {
  const childIds = new Set<string>()

  for (const e of config.edges) {
    if (e.from_node === nodeId) {
      childIds.add(e.to_node)
    }
  }

  if (childIds.size === 0) return { nodes: [], edges: [] }

  const nodes = config.nodes.filter((n) => childIds.has(n.node_id))

  // Collect edges among the children + edges from parent to children
  const edgeSet = new Set<string>()
  const edges: XmapEdge[] = []
  for (const e of config.edges) {
    const fromInGroup = childIds.has(e.from_node) || e.from_node === nodeId
    const toInGroup = childIds.has(e.to_node) || e.to_node === nodeId
    if (fromInGroup && toInGroup && !edgeSet.has(e.edge_id)) {
      edgeSet.add(e.edge_id)
      edges.push(e)
    }
  }

  return { nodes, edges }
}

/**
 * Check if a node is expandable (has children locally or is a known remote-expandable node).
 */
export function isNodeExpandable(
  config: XmapV7Config | null,
  nodeId: string,
): boolean {
  if (config) {
    for (const e of config.edges) {
      if (e.from_node === nodeId) return true
    }
  }
  return KNOWN_EXPANDABLE_NODES.has(nodeId)
}

const KNOWN_EXPANDABLE_NODES = new Set([
  'pow3r-writer', 'pow3r.writer',
  'pow3r-control', 'pow3r.control',
  'pimp', 'pkg',
  'x-system', 'guardian-system',
  'pow3r-config', 'pow3r-pass',
  'workflow-executor', 'component-factory',
  'director-agent', 'plan-memory',
])

/** Sub-nodes: nodes connected via edges (both directions) */
export function getSubNodesForNode(
  config: XmapV7Config,
  nodeId: string
): { nodes: XmapNode[]; edges: XmapEdge[] } {
  const connectedIds = new Set<string>()
  const subEdges: XmapEdge[] = []
  for (const e of config.edges) {
    if (e.from_node === nodeId || e.to_node === nodeId) {
      connectedIds.add(e.from_node)
      connectedIds.add(e.to_node)
      subEdges.push(e)
    }
  }
  connectedIds.delete(nodeId)
  const nodes = config.nodes.filter((n) => connectedIds.has(n.node_id))
  return { nodes, edges: subEdges }
}

/** Workflows that reference this node in their steps */
export function getWorkflowsForNode(
  config: XmapV7Config,
  nodeId: string
): XmapWorkflow[] {
  return (config.workflows ?? []).filter((wf) =>
    (wf.steps ?? []).some((s) => s.node === nodeId)
  )
}

/** Filter X-System events by nodeId */
export function filterEventsByNode(
  events: XStreamEvent[],
  nodeId: string,
  limit = 50
): XStreamEvent[] {
  return events
    .filter(
      (e) =>
        e.nodeId === nodeId ||
        (e as { metadata?: { nodeId?: string; node_id?: string } }).metadata?.nodeId === nodeId ||
        (e as { metadata?: { nodeId?: string; node_id?: string } }).metadata?.node_id === nodeId
    )
    .slice(-limit)
}

/** MCP tool summary - fetch from API or return static for known servers */
export interface McpToolSummary {
  server: string
  toolName: string
  description?: string
}

/** Map node_id to likely MCP server(s) for tool lookup */
const NODE_TO_MCP_SERVER: Record<string, string[]> = {
  'pow3r-config': ['pow3r', 'orchestrator'],
  'pkg-knowledge': ['pkg'],
  'x-system': ['x-plugin', 'xlog', 'xfiles', 'xstream'],
  'guardian-system': ['guardian'],
  'pow3r-pass': ['pass', 'pow3r'],
  'workflow-executor': ['orchestrator', 'workflow-library'],
  'pow3r-writer': ['gemini', 'replicate', 'data', 'elevenlabs', 'suno'],
  'component-factory': ['component-system'],
  'director-agent': ['abi', 'orchestrator'],
  'plan-memory': ['plan-memory'],
}

export function getMcpServersForNode(nodeId: string): string[] {
  return NODE_TO_MCP_SERVER[nodeId] ?? []
}

/** Fetch MCP tools list from config.superbots.link (if available) */
export async function fetchMcpToolsForServer(server: string): Promise<McpToolSummary[]> {
  try {
    const res = await fetch(`${API_BASE}/mcp/${server}/tools/list`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', method: 'tools/list', id: '1', params: {} }),
    })
    const json = await res.json()
    const tools = json.result?.tools ?? json.tools ?? []
    return tools.map((t: { name?: string; description?: string }) => ({
      server,
      toolName: t.name ?? 'unknown',
      description: t.description,
    }))
  } catch {
    return []
  }
}
