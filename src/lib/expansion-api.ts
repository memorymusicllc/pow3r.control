/**
 * pow3r.control - Expansion Data API
 *
 * Purpose:
 * - Fetches expansion data for recursive node drill-down
 * - XMAP sub-nodes (from edges), workflows referencing node, MCP tools, X-System events
 * - Used by NodeExpansionProvider and ExpandedNodeView
 */
import type { XmapNode, XmapEdge, XmapWorkflow, XmapV7Config } from './types'
import type { XStreamEvent } from './x-system-types'

const API_BASE = 'https://config.superbots.link/api'

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
