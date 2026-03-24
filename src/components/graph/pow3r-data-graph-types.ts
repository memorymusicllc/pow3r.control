/**
 * pow3r.control - Pow3r 3D Data Graph (v7-style manifest)
 *
 * Declarative scene: nodes, edges, menu, and state-change hints for agents.
 * Not the full XMAP schema; a focused subgraph for Design Playbook demos.
 */

export interface Pow3rDataGraphSceneUi {
  theme?: string
  visualCues?: {
    nodeHighlight?: string
    edgeHighlight?: string
    menuBackground?: string
    fontColor?: string
  }
}

export interface Pow3rDataGraphScene {
  id?: string
  name?: string
  description?: string
  ui?: Pow3rDataGraphSceneUi
}

export interface Pow3rDataGraphNodeUi {
  label?: string
  shape?: 'sphere' | 'box' | 'cylinder'
  color?: string
  size?: number
}

export interface Pow3rDataGraphNode {
  node_id: string
  node_type?: string
  name?: string
  position: [number, number, number]
  ui: Pow3rDataGraphNodeUi
  metadata?: { reference?: string }
}

export interface Pow3rDataGraphEdgeUi {
  color?: string
  lineWidth?: number
}

export interface Pow3rDataGraphEdge {
  edge_id: string
  from_node: string
  to_node: string
  edge_type?: string
  ui: Pow3rDataGraphEdgeUi
  metadata?: { reference?: string }
}

export interface Pow3rDataGraphMenuItem {
  label: string
  action: 'inspect_node' | 'inspect_edge'
  target: string
}

export interface Pow3rDataGraphConfig {
  schema_version?: string
  scene?: Pow3rDataGraphScene
  nodes: Pow3rDataGraphNode[]
  edges: Pow3rDataGraphEdge[]
  menu?: { enabled?: boolean; position?: string; items: Pow3rDataGraphMenuItem[] }
}
