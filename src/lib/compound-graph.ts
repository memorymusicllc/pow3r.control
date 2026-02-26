/**
 * Compound Graph Layout Engine
 *
 * Purpose:
 * - Computes visible nodes, edges, and group boundaries when nodes are expanded inline
 * - Expanded parents are replaced by their children; external edges are re-routed
 * - Returns a flat structure that D3-force can simulate directly
 *
 * Agent Instructions:
 * - Call computeCompoundGraph() with the base config, expanded IDs, and cached sub-graphs
 * - The result feeds directly into the D3 force simulation in Graph2D / Graph3D
 * - Group boundaries are computed after simulation tick from child positions
 */
import type { XmapNode, XmapEdge } from './types'
import type { ExpansionCacheEntry } from '../store/control-store'

/** A node in the compound graph — either a top-level node or a child of an expanded parent */
export interface CompoundNode extends XmapNode {
  /** If this node is a child of an expanded parent, stores the parent's node_id */
  parentGroupId?: string
  /** Virtual centroid node for group (not rendered as a real node) */
  isGroupCentroid?: boolean
}

/** An edge in the compound graph — may be re-routed from parent to group centroid */
export interface CompoundEdge extends XmapEdge {
  /** Original from_node before re-routing (for display) */
  originalFromNode?: string
  /** Original to_node before re-routing (for display) */
  originalToNode?: string
  /** If true, this is an internal edge within a group */
  isInternalEdge?: boolean
}

/** Group boundary descriptor, computed from child positions after simulation */
export interface GroupBoundary {
  parentNodeId: string
  parentNode: XmapNode
  childNodeIds: Set<string>
  centroidId: string
}

export interface CompoundGraphResult {
  nodes: CompoundNode[]
  edges: CompoundEdge[]
  groups: GroupBoundary[]
  /** Set of node IDs that are expandable (have children in cache or local edges) */
  expandableNodeIds: Set<string>
  /** Map of child node IDs to their parent's position hint (for initial placement) */
  childInitialPositionHints: Map<string, string>
}

/**
 * Compute the compound graph from base config + inline expansion state.
 *
 * For each expanded node:
 * 1. Remove the parent from visible nodes
 * 2. Insert a virtual centroid node (for edge re-routing)
 * 3. Insert all child nodes tagged with parentGroupId
 * 4. Insert internal edges between children
 * 5. Re-route any external edge pointing to/from the parent to the centroid
 */
export function computeCompoundGraph(
  baseNodes: XmapNode[],
  baseEdges: XmapEdge[],
  inlineExpandedIds: Set<string>,
  expansionCache: Map<string, ExpansionCacheEntry>,
): CompoundGraphResult {
  const expandableNodeIds = new Set<string>()

  for (const [nodeId] of expansionCache) {
    expandableNodeIds.add(nodeId)
  }

  // Also mark nodes expandable if we can see they have outgoing "contains"-like edges
  // or if their ID is a known expandable node in cache
  for (const e of baseEdges) {
    if (isContainmentEdge(e)) {
      expandableNodeIds.add(e.from_node)
    }
  }

  if (inlineExpandedIds.size === 0) {
    return {
      nodes: baseNodes.map((n) => ({ ...n })),
      edges: baseEdges.map((e) => ({ ...e })),
      groups: [],
      expandableNodeIds,
      childInitialPositionHints: new Map(),
    }
  }

  const resultNodes: CompoundNode[] = []
  const resultEdges: CompoundEdge[] = []
  const groups: GroupBoundary[] = []

  const expandedParentIds = new Set<string>()
  const childToParentMap = new Map<string, string>()

  for (const parentId of inlineExpandedIds) {
    const cached = expansionCache.get(parentId)
    if (!cached || cached.nodes.length === 0) continue

    expandedParentIds.add(parentId)
    const parentNode = baseNodes.find((n) => n.node_id === parentId)
    if (!parentNode) continue

    const centroidId = `__centroid__${parentId}`
    const childIds = new Set(cached.nodes.map((n) => n.node_id))

    // Virtual centroid node for edge re-routing
    const centroidNode: CompoundNode = {
      ...parentNode,
      node_id: centroidId,
      name: parentNode.name,
      isGroupCentroid: true,
      parentGroupId: undefined,
    }
    resultNodes.push(centroidNode)

    // Add child nodes
    for (const child of cached.nodes) {
      childToParentMap.set(child.node_id, parentId)
      resultNodes.push({
        ...child,
        parentGroupId: parentId,
      })
      // If child also has sub-data in cache, mark expandable
      if (expansionCache.has(child.node_id)) {
        expandableNodeIds.add(child.node_id)
      }
    }

    // Add internal edges (between children within this group)
    for (const edge of cached.edges) {
      const fromInGroup = childIds.has(edge.from_node)
      const toInGroup = childIds.has(edge.to_node)
      if (fromInGroup && toInGroup) {
        resultEdges.push({
          ...edge,
          isInternalEdge: true,
        })
      }
    }

    groups.push({
      parentNodeId: parentId,
      parentNode,
      childNodeIds: childIds,
      centroidId,
    })
  }

  // Add non-expanded top-level nodes
  for (const node of baseNodes) {
    if (!expandedParentIds.has(node.node_id)) {
      resultNodes.push({ ...node })
    }
  }

  // Process base edges: re-route those touching expanded parents
  for (const edge of baseEdges) {
    const fromExpanded = expandedParentIds.has(edge.from_node)
    const toExpanded = expandedParentIds.has(edge.to_node)

    if (!fromExpanded && !toExpanded) {
      // Neither end is expanded — keep as-is
      resultEdges.push({ ...edge })
    } else {
      // Re-route to centroid
      const newFrom = fromExpanded ? `__centroid__${edge.from_node}` : edge.from_node
      const newTo = toExpanded ? `__centroid__${edge.to_node}` : edge.to_node
      resultEdges.push({
        ...edge,
        from_node: newFrom,
        to_node: newTo,
        originalFromNode: edge.from_node,
        originalToNode: edge.to_node,
      })
    }
  }

  // Build position hints so children start at parent's location for smooth fan-out
  const childInitialPositionHints = new Map<string, string>()
  for (const [childId, parentId] of childToParentMap) {
    const group = groups.find((g) => g.parentNodeId === parentId)
    if (group) {
      childInitialPositionHints.set(childId, group.centroidId)
    }
  }

  return { nodes: resultNodes, edges: resultEdges, groups, expandableNodeIds, childInitialPositionHints }
}

/**
 * Compute a convex-hull-style bounding boundary from a set of positions.
 * Returns center and radius for a circular boundary (simpler than true convex hull).
 */
export function computeGroupBounds(
  childIds: Set<string>,
  positions: Map<string, { x: number; y: number }>,
  padding = 50,
): { cx: number; cy: number; radius: number } | null {
  let sumX = 0
  let sumY = 0
  let count = 0

  for (const id of childIds) {
    const pos = positions.get(id)
    if (!pos) continue
    sumX += pos.x
    sumY += pos.y
    count++
  }

  if (count === 0) return null

  const cx = sumX / count
  const cy = sumY / count

  let maxDist = 0
  for (const id of childIds) {
    const pos = positions.get(id)
    if (!pos) continue
    const dx = pos.x - cx
    const dy = pos.y - cy
    maxDist = Math.max(maxDist, Math.sqrt(dx * dx + dy * dy))
  }

  return { cx, cy, radius: maxDist + padding }
}

/** Check if an edge represents a containment relationship */
function isContainmentEdge(edge: XmapEdge): boolean {
  const etype = (edge as XmapEdge & { edge_type?: string }).edge_type
  return etype === 'control' || etype === 'data'
}
