/**
 * pow3r.control - Node Expansion Context
 *
 * Purpose:
 * - Manages recursive expansion state (breadcrumb stack)
 * - Provides expansion data: sub-nodes, workflows, MCP tools, X-System events
 * - Used by ExpandedNodeView and BreadcrumbTrail
 */
import {
  createContext,
  useContext,
  useMemo,
  useCallback,
  useState,
  useEffect,
  type ReactNode,
} from 'react'
import { useControlStore } from '../store/control-store'
import { useXSystemStore } from '../store/x-system-store'
import {
  fetchExpansionSubgraph,
  fetchExpansionFailures,
  getSubNodesForNode,
  getWorkflowsForNode,
  filterEventsByNode,
  getMcpServersForNode,
  fetchMcpToolsForServer,
  type McpToolSummary,
} from '../lib/expansion-api'
import type { XmapNode, XmapEdge, XmapWorkflow } from '../lib/types'
import type { XStreamEvent } from '../lib/x-system-types'

export interface ExpansionData {
  subNodes: XmapNode[]
  subEdges: XmapEdge[]
  workflows: XmapWorkflow[]
  events: XStreamEvent[]
  mcpTools: McpToolSummary[]
  subgraph?: { nodes: XmapNode[]; edges: XmapEdge[] }
  failures?: { nodeFailures: any[]; edgeFailures: any[]; xFilesCases: any[] }
}

interface NodeExpansionContextValue {
  /** Current expansion stack (node IDs from root to current) */
  expansionStack: string[]
  /** Push a node onto the stack (drill down) */
  pushExpansion: (nodeId: string) => void
  /** Pop the top of the stack (go back) */
  popExpansion: () => void
  /** Clear the entire stack */
  clearExpansion: () => void
  /** Go to a specific level in the stack (by index, 0 = root) */
  goToExpansion: (nodeId: string) => void
  /** Current expanded node ID (top of stack) */
  currentExpandedId: string | null
  /** Expansion data for the current node */
  expansionData: ExpansionData | null
  /** Loading state for async fetches */
  isLoading: boolean
}

const NodeExpansionContext = createContext<NodeExpansionContextValue | null>(null)

export function NodeExpansionProvider({ children }: { children: ReactNode }) {
  const config = useControlStore((s) => s.config)
  const expandedNodeId = useControlStore((s) => s.expandedNodeId)
  const expandNode = useControlStore((s) => s.expandNode)

  const [expansionStack, setExpansionStack] = useState<string[]>([])
  const [mcpTools, setMcpTools] = useState<McpToolSummary[]>([])
  const [subgraph, setSubgraph] = useState<{ nodes: XmapNode[]; edges: XmapEdge[] } | undefined>()
  const [failures, setFailures] = useState<{ nodeFailures: any[]; edgeFailures: any[]; xFilesCases: any[] } | undefined>()
  const [isLoading, setIsLoading] = useState(false)

  const currentExpandedId = expandedNodeId ?? (expansionStack.length > 0 ? expansionStack[expansionStack.length - 1] : null)

  const xEvents = useXSystemStore((s) => s.events)

  const expansionData = useMemo((): ExpansionData | null => {
    const nodeId = expandedNodeId ?? currentExpandedId
    if (!config || !nodeId) return null

    const { nodes: subNodes, edges: subEdges } = getSubNodesForNode(config, nodeId)
    const workflows = getWorkflowsForNode(config, nodeId)
    const events = filterEventsByNode(xEvents, nodeId)

    return {
      subNodes,
      subEdges,
      workflows,
      events,
      mcpTools,
      subgraph,
      failures,
    }
  }, [config, expandedNodeId, currentExpandedId, xEvents, mcpTools, subgraph, failures])

  useEffect(() => {
    if (!expandedNodeId) {
      setExpansionStack([])
      setMcpTools([])
      setSubgraph(undefined)
      setFailures(undefined)
      return
    }
    setExpansionStack((prev) => {
      if (prev.length > 0 && prev[prev.length - 1] === expandedNodeId) return prev
      if (prev.includes(expandedNodeId)) {
        const idx = prev.indexOf(expandedNodeId)
        return prev.slice(0, idx + 1)
      }
      if (prev.length === 0) return [expandedNodeId]
      return [...prev, expandedNodeId]
    })
  }, [expandedNodeId])

  useEffect(() => {
    const nodeId = expandedNodeId ?? currentExpandedId
    if (!nodeId) return
    
    setIsLoading(true)
    
    // Reset async data
    setMcpTools([])
    setSubgraph(undefined)
    setFailures(undefined)

    const servers = getMcpServersForNode(nodeId)
    const mcpPromise = servers.length > 0 
      ? Promise.all(servers.map((s) => fetchMcpToolsForServer(s))).then(results => results.flat())
      : Promise.resolve([])

    const subgraphPromise = fetchExpansionSubgraph(nodeId)
    const failuresPromise = fetchExpansionFailures(nodeId)

    Promise.all([mcpPromise, subgraphPromise, failuresPromise])
      .then(([tools, sub, fail]) => {
        setMcpTools(tools)
        if (sub) setSubgraph(sub)
        if (fail) setFailures(fail)
      })
      .finally(() => setIsLoading(false))
  }, [expandedNodeId, currentExpandedId])

  const pushExpansion = useCallback((nodeId: string) => {
    setExpansionStack((prev) =>
      prev[prev.length - 1] === nodeId ? prev : [...prev, nodeId]
    )
    expandNode(nodeId)
  }, [expandNode])

  const popExpansion = useCallback(() => {
    setExpansionStack((prev) => {
      const next = prev.slice(0, -1)
      const parent = next.length > 0 ? next[next.length - 1] : null
      expandNode(parent)
      return next
    })
  }, [expandNode])

  const clearExpansion = useCallback(() => {
    expandNode(null)
    setExpansionStack([])
  }, [expandNode])

  const goToExpansion = useCallback((nodeId: string) => {
    setExpansionStack((prev) => {
      const idx = prev.indexOf(nodeId)
      if (idx < 0) return prev
      const next = prev.slice(0, idx + 1)
      expandNode(nodeId)
      return next
    })
    expandNode(nodeId)
  }, [expandNode])

  const value: NodeExpansionContextValue = useMemo(
    () => ({
      expansionStack,
      pushExpansion,
      popExpansion,
      clearExpansion,
      goToExpansion,
      currentExpandedId: expandedNodeId ?? (expansionStack.length > 0 ? expansionStack[expansionStack.length - 1] : null),
      expansionData,
      isLoading,
    }),
    [expansionStack, expandedNodeId, pushExpansion, popExpansion, clearExpansion, goToExpansion, expansionData, isLoading]
  )

  return (
    <NodeExpansionContext.Provider value={value}>
      {children}
    </NodeExpansionContext.Provider>
  )
}

export function useNodeExpansion() {
  const ctx = useContext(NodeExpansionContext)
  if (!ctx) {
    throw new Error('useNodeExpansion must be used within NodeExpansionProvider')
  }
  return ctx
}
