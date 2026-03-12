/**
 * pow3r.control - Zustand Global Store
 *
 * Purpose:
 * - Central state for the entire control surface
 * - Holds XMAP v7 config data, view state, selection, search/filters
 * - Drives all visualization layers
 *
 * Agent Instructions:
 * - Use `useControlStore` hook in components
 * - Update via actions (set functions), not direct mutation
 * - XMAP data loaded via `loadConfig` action
 */
import { create } from 'zustand'
import type {
  XmapV7Config,
  XmapNode,
  XmapEdge,
  GuardianGate,
  XmapWorkflow,
  ViewMode,
  LayoutMode,
  NodeType,
  NodeStatus,
} from '../lib/types'

/** Cached sub-graph data for an expanded node */
export interface ExpansionCacheEntry {
  nodes: XmapNode[]
  edges: XmapEdge[]
}

interface ControlState {
  config: XmapV7Config | null
  configLoadedAt: string | null
  isLoading: boolean
  error: string | null

  viewMode: ViewMode
  layoutMode: LayoutMode

  selectedNodeId: string | null
  selectedEdgeId: string | null
  expandedNodeId: string | null
  hoveredNodeId: string | null

  /** In-graph expansion: set of node IDs currently expanded inline */
  inlineExpandedNodeIds: Set<string>
  /** Cached sub-graph data keyed by parent node ID */
  expansionCache: Map<string, ExpansionCacheEntry>

  searchQuery: string
  filterNodeTypes: Set<NodeType>
  filterStatuses: Set<NodeStatus>
  filterTechTags: Set<string>

  layerVisibility: {
    topology: number
    governance: number
    orchestration: number
    observability: number
    intelligence: number
    configuration: number
    meta: number
  }

  telemetryDensity: number
  showMapKey: boolean
  showControlSurface: boolean
  showGuardianDashboard: boolean
  expandedWorkflowId: string | null
  workflowBreadcrumb: string[]
  showGovernanceOverlay: boolean

  /** Review mode: visible grid/bounds, contrast-safe outlines, debug labels */
  isReviewMode: boolean

  /** Canvas interaction hints (Drag, scroll, click...) */
  showCanvasInstructions: boolean

  // Actions
  loadConfig: (config: XmapV7Config) => void
  setViewMode: (mode: ViewMode) => void
  setLayoutMode: (mode: LayoutMode) => void
  selectNode: (nodeId: string | null) => void
  selectEdge: (edgeId: string | null) => void
  expandNode: (nodeId: string | null) => void
  setHoveredNode: (nodeId: string | null) => void
  setSearchQuery: (query: string) => void
  toggleNodeTypeFilter: (type: NodeType) => void
  toggleStatusFilter: (status: NodeStatus) => void
  toggleTechTag: (tag: string) => void
  clearFilters: () => void
  setLayerVisibility: (layer: string, value: number) => void
  setTelemetryDensity: (density: number) => void
  toggleMapKey: () => void
  toggleControlSurface: () => void
  toggleGuardianDashboard: () => void
  expandWorkflow: (workflowId: string | null) => void
  popWorkflowBreadcrumb: () => void
  toggleGovernanceOverlay: () => void
  toggleReviewMode: () => void
  toggleCanvasInstructions: () => void

  /** Toggle a node's in-graph expansion (expand if collapsed, collapse if expanded) */
  toggleInlineExpansion: (nodeId: string) => void
  /** Collapse a specific node's in-graph expansion */
  collapseInlineNode: (nodeId: string) => void
  /** Collapse all in-graph expansions */
  collapseAllInline: () => void
  /** Store fetched sub-graph data for a node */
  setExpansionCache: (nodeId: string, data: ExpansionCacheEntry) => void
}

// Selectors (derived data)
export const selectFilteredNodes = (state: ControlState): XmapNode[] => {
  if (!state.config) return []
  let nodes = state.config.nodes

  if (state.searchQuery) {
    const q = state.searchQuery.toLowerCase()
    nodes = nodes.filter(
      (n) =>
        n.name.toLowerCase().includes(q) ||
        n.node_id.toLowerCase().includes(q) ||
        n.node_type.toLowerCase().includes(q) ||
        (n.description?.toLowerCase().includes(q) ?? false) ||
        (n.tech_stack?.some((t) => t.toLowerCase().includes(q)) ?? false) ||
        (n.owner?.toLowerCase().includes(q) ?? false)
    )
  }

  if (state.filterNodeTypes.size > 0) {
    nodes = nodes.filter((n) => state.filterNodeTypes.has(n.node_type))
  }

  if (state.filterStatuses.size > 0) {
    nodes = nodes.filter((n) => state.filterStatuses.has(n.status))
  }

  if (state.filterTechTags.size > 0) {
    nodes = nodes.filter(
      (n) => n.tech_stack?.some((t) => state.filterTechTags.has(t)) ?? false
    )
  }

  return nodes
}

export const selectFilteredEdges = (state: ControlState): XmapEdge[] => {
  if (!state.config) return []
  const visibleNodeIds = new Set(selectFilteredNodes(state).map((n) => n.node_id))
  return state.config.edges.filter(
    (e) => visibleNodeIds.has(e.from_node) && visibleNodeIds.has(e.to_node)
  )
}

export const selectSelectedNode = (state: ControlState): XmapNode | null => {
  if (!state.config || !state.selectedNodeId) return null
  return state.config.nodes.find((n) => n.node_id === state.selectedNodeId) ?? null
}

export const selectSelectedEdge = (state: ControlState): XmapEdge | null => {
  if (!state.config || !state.selectedEdgeId) return null
  return state.config.edges.find((e) => e.edge_id === state.selectedEdgeId) ?? null
}

export const selectGuardianGates = (state: ControlState): GuardianGate[] => {
  return state.config?.guardian ?? []
}

export const selectWorkflows = (state: ControlState): XmapWorkflow[] => {
  return state.config?.workflows ?? []
}

export const selectAllTechTags = (state: ControlState): string[] => {
  if (!state.config) return []
  const tags = new Set<string>()
  state.config.nodes.forEach((n) => n.tech_stack?.forEach((t) => tags.add(t)))
  return Array.from(tags).sort()
}

export const useControlStore = create<ControlState>((set) => ({
  config: null,
  configLoadedAt: null,
  isLoading: false,
  error: null,

  viewMode: '2d',
  layoutMode: 'force-directed',

  selectedNodeId: null,
  selectedEdgeId: null,
  expandedNodeId: null,
  hoveredNodeId: null,

  inlineExpandedNodeIds: new Set<string>(),
  expansionCache: new Map<string, ExpansionCacheEntry>(),

  searchQuery: '',
  filterNodeTypes: new Set(),
  filterStatuses: new Set(),
  filterTechTags: new Set(),

  layerVisibility: {
    topology: 1.0,
    governance: 0.8,
    orchestration: 0.8,
    observability: 0.6,
    intelligence: 0.4,
    configuration: 0.4,
    meta: 1.0,
  },

  telemetryDensity: 0.5,
  showMapKey: true,
  showControlSurface: false,
  showGuardianDashboard: false,
  expandedWorkflowId: null,
  workflowBreadcrumb: [],
  showGovernanceOverlay: true,
  isReviewMode: (() => {
    if (typeof window === 'undefined') return false
    try {
      return localStorage.getItem('pow3r-control-review-mode') === 'true'
    } catch {
      return false
    }
  })(),
  showCanvasInstructions: true,

  loadConfig: (config) =>
    set({ config, configLoadedAt: new Date().toISOString(), isLoading: false, error: null }),

  setViewMode: (viewMode) => set({ viewMode }),
  setLayoutMode: (layoutMode) => set({ layoutMode }),

  selectNode: (nodeId) =>
    set({ selectedNodeId: nodeId, selectedEdgeId: null }),

  selectEdge: (edgeId) =>
    set({ selectedEdgeId: edgeId, selectedNodeId: null }),

  expandNode: (nodeId) => set({ expandedNodeId: nodeId }),

  setHoveredNode: (nodeId) => set({ hoveredNodeId: nodeId }),

  setSearchQuery: (searchQuery) => set({ searchQuery }),

  toggleNodeTypeFilter: (type) =>
    set((state) => {
      const next = new Set(state.filterNodeTypes)
      if (next.has(type)) next.delete(type)
      else next.add(type)
      return { filterNodeTypes: next }
    }),

  toggleStatusFilter: (status) =>
    set((state) => {
      const next = new Set(state.filterStatuses)
      if (next.has(status)) next.delete(status)
      else next.add(status)
      return { filterStatuses: next }
    }),

  toggleTechTag: (tag) =>
    set((state) => {
      const next = new Set(state.filterTechTags)
      if (next.has(tag)) next.delete(tag)
      else next.add(tag)
      return { filterTechTags: next }
    }),

  clearFilters: () =>
    set({
      searchQuery: '',
      filterNodeTypes: new Set(),
      filterStatuses: new Set(),
      filterTechTags: new Set(),
    }),

  setLayerVisibility: (layer, value) =>
    set((state) => ({
      layerVisibility: { ...state.layerVisibility, [layer]: value },
    })),

  setTelemetryDensity: (telemetryDensity) => set({ telemetryDensity }),

  toggleMapKey: () => set((state) => ({ showMapKey: !state.showMapKey })),

  toggleControlSurface: () =>
    set((state) => ({ showControlSurface: !state.showControlSurface })),

  toggleGuardianDashboard: () =>
    set((state) => ({ showGuardianDashboard: !state.showGuardianDashboard })),

  expandWorkflow: (workflowId) =>
    set((state) => ({
      expandedWorkflowId: workflowId,
      workflowBreadcrumb: workflowId
        ? [...state.workflowBreadcrumb, workflowId]
        : [],
    })),

  popWorkflowBreadcrumb: () =>
    set((state) => {
      const crumbs = [...state.workflowBreadcrumb]
      crumbs.pop()
      return {
        workflowBreadcrumb: crumbs,
        expandedWorkflowId: crumbs.length > 0 ? crumbs[crumbs.length - 1] : null,
      }
    }),

  toggleGovernanceOverlay: () =>
    set((state) => ({ showGovernanceOverlay: !state.showGovernanceOverlay })),

  toggleCanvasInstructions: () =>
    set((state) => ({ showCanvasInstructions: !state.showCanvasInstructions })),

  toggleReviewMode: () =>
    set((state) => {
      const next = !state.isReviewMode
      if (typeof window !== 'undefined') {
        localStorage.setItem('pow3r-control-review-mode', String(next))
      }
      return { isReviewMode: next }
    }),

  toggleInlineExpansion: (nodeId) =>
    set((state) => {
      const next = new Set(state.inlineExpandedNodeIds)
      if (next.has(nodeId)) {
        next.delete(nodeId)
      } else {
        next.add(nodeId)
      }
      return { inlineExpandedNodeIds: next }
    }),

  collapseInlineNode: (nodeId) =>
    set((state) => {
      const next = new Set(state.inlineExpandedNodeIds)
      next.delete(nodeId)
      const cache = new Map(state.expansionCache)
      cache.delete(nodeId)
      // Clear selection if selected node was a child of the collapsed group
      const cached = state.expansionCache.get(nodeId)
      const childIds = cached ? new Set(cached.nodes.map((n) => n.node_id)) : new Set<string>()
      childIds.add(`__centroid__${nodeId}`)
      const clearSelection =
        state.selectedNodeId && childIds.has(state.selectedNodeId)
          ? { selectedNodeId: null as string | null }
          : {}
      return { inlineExpandedNodeIds: next, expansionCache: cache, ...clearSelection }
    }),

  collapseAllInline: () =>
    set({
      inlineExpandedNodeIds: new Set<string>(),
      expansionCache: new Map<string, ExpansionCacheEntry>(),
    }),

  setExpansionCache: (nodeId, data) =>
    set((state) => {
      const cache = new Map(state.expansionCache)
      cache.set(nodeId, data)
      return { expansionCache: cache }
    }),
}))
