/**
 * pow3r.control - XMAP v7 TypeScript Types
 *
 * Purpose:
 * - Canonical type definitions mapped from pow3r_schema_v7.json
 * - Covers all 15 XMAP v7 top-level sections
 * - Used throughout the visualization, store, and panels
 *
 * Schema source: configs/schemas/pow3r_schema_v7.json in pow3r.config
 *
 * Agent Instructions:
 * - Keep in sync with pow3r_schema_v7.json
 * - All fields are typed; optional fields use `?`
 * - Status enums match schema exactly
 */

// --- Core Enums ---

export type ManifestStatus = 'draft' | 'proposed' | 'validated' | 'deployed' | 'archived'

export type NodeType =
  | 'service'
  | 'ui'
  | 'data'
  | 'workflow'
  | 'observer'
  | 'component_factory'
  | 'mcp_server'
  | 'gateway'
  | 'agent'

export type NodeStatus =
  | 'unknown'
  | 'healthy'
  | 'degraded'
  | 'failed'
  | 'deploying'
  | 'validating'
  | 'validated'
  | 'deployed'

export type EdgeType = 'data' | 'control' | 'event' | 'api'

export type WorkflowType =
  | 'deployment'
  | 'validation'
  | 'self-heal'
  | 'media-generation'
  | 'test'

export type GatePhase = 'pre-commit' | 'pre-deploy' | 'post-deploy'

export type EvaluationPolicy = 'automated' | 'manual' | 'mixed'

export type GateAction = 'block' | 'escalate' | 'auto-fix-proposal'

export type ViewMode = '2d' | '3d' | 'timeline' | 'dashboard' | 'library' | 'abacus' | 'agents' | 'cursor' | 'playground'

export type LayoutMode = 'force-directed' | 'orbital' | 'hierarchy' | 'dagre'

// --- XMAP v7 Data Structures ---

export interface XmapMetadata {
  id: string
  version: string
  created_at: string
  created_by: string
  last_modified_at?: string
  last_modified_by?: string
  canonical_hash?: string
}

export interface XmapManifest {
  manifest_id: string
  manifest_version: string
  manifest_status: ManifestStatus
  change_proposals?: string[]
  required_gates?: string[]
}

export interface XmapNode {
  node_id: string
  node_type: NodeType
  name: string
  description?: string
  tech_stack?: string[]
  deployment_targets?: string[]
  status: NodeStatus
  owner?: string
  required_tests?: string[]
  telemetry_endpoints?: string[]
  privileges?: Record<string, string>
  immutable_flags?: string[]
}

export interface XmapEdge {
  edge_id: string
  from_node: string
  to_node: string
  edge_type: EdgeType
  permission_schema?: Record<string, string>
  allowed_agents_roles?: string[]
  encryption_policy?: string
  rate_limits?: Record<string, number>
  quotas?: Record<string, number>
  provenance_requirements?: string
}

export interface WorkflowStep {
  step_id: string
  node: string
  action: string
}

export interface XmapWorkflow {
  workflow_id: string
  workflow_type: WorkflowType
  steps?: WorkflowStep[]
  retry_policy?: {
    max_attempts: number
    backoff: string
  }
  evidence_policy?: {
    required_artifacts: string[]
  }
  guardian_gates?: string[]
  telemetry_requirements?: string[]
}

export interface GuardianGate {
  gate_id: string
  type: GatePhase
  evaluation_policy: EvaluationPolicy
  required_evidence?: string[]
  action_on_fail: GateAction
}

export interface Validator {
  validator_id: string
  rules?: Array<{
    rule_id: string
    description: string
  }>
  enforcement_mode?: string
}

export interface XmapTest {
  test_id: string
  type: string
  test_runner?: string
  required_result?: {
    pass_threshold: number
  }
  evidence_artifacts?: string[]
  auto_fix_capabilities?: boolean
}

export interface XmapTelemetry {
  metrics?: string[]
  logs?: string[]
  traces?: string[]
  retention_policy?: {
    days: number
  }
  alerting_rules?: Array<Record<string, unknown>>
}

export interface ConfigControls {
  patch_policy?: string
  allowed_patch_ops?: string[]
  contract_tests_required?: string[]
  manifest_lock?: boolean
}

export interface AgentView {
  view_id: string
  view_scope?: {
    nodes?: string[]
  }
  ephemeral?: boolean
  view_token?: string
}

export interface UiContract {
  viewer_bindings?: Record<string, unknown>
  evidence_capture_hooks?: string[]
}

export interface Compliance {
  compliance_score?: number
  evidence_refs?: string[]
  compliance_status?: string
  remediation_plan_ref?: string
}

/** Complete XMAP v7 document */
export interface XmapV7Config {
  metadata: XmapMetadata
  manifest: XmapManifest
  directorAgent?: string
  nodes: XmapNode[]
  edges: XmapEdge[]
  workflows: XmapWorkflow[]
  guardian: GuardianGate[]
  validator: Validator[]
  tests: XmapTest[]
  telemetry: XmapTelemetry[]
  config_controls: ConfigControls
  provenance: Array<Record<string, unknown>>
  agent_views: AgentView[]
  ui_contracts: UiContract[]
  compliance: Compliance
}

// --- Visualization Types ---

/** Computed position for a node in the graph */
export interface NodePosition {
  x: number
  y: number
  z: number
  vx?: number
  vy?: number
  vz?: number
}

/** Node with computed visualization data */
export interface VisualNode extends XmapNode {
  position: NodePosition
  color: string
  size: number
  glowIntensity: number
  isExpanded?: boolean
  childNodes?: VisualNode[]
  childEdges?: XmapEdge[]
}

/** Edge with computed visualization data */
export interface VisualEdge extends XmapEdge {
  sourcePosition?: NodePosition
  targetPosition?: NodePosition
  color: string
  width: number
  particleSpeed: number
  particleDensity: number
  isBidirectional?: boolean
}

/** Color scheme for Data-as-Light */
export interface ColorScheme {
  cyan: string
  magenta: string
  purple: string
  amber: string
  error: string
  success: string
  gold: string
  bgDeep: string
  bgSurface: string
  bgCard: string
  bgPanel: string
}

export const DEFAULT_COLORS: ColorScheme = {
  cyan: '#00E5FF',
  magenta: '#FF00FF',
  purple: '#A855F7',
  amber: '#FFB300',
  error: '#FF3D00',
  success: '#00E676',
  gold: '#FFD700',
  bgDeep: '#000000',
  bgSurface: '#0A0A0F',
  bgCard: '#111118',
  bgPanel: '#1A1A24',
}

/** Maps node_type to a visual color */
export const NODE_TYPE_COLORS: Record<NodeType, string> = {
  service: DEFAULT_COLORS.cyan,
  ui: '#60B5FF',
  data: '#FF9149',
  workflow: '#72BF78',
  observer: '#A19AD3',
  component_factory: '#FF90BB',
  mcp_server: DEFAULT_COLORS.purple,
  gateway: '#80D8C3',
  agent: DEFAULT_COLORS.magenta,
}

/** Maps node status to emissive color */
export const STATUS_COLORS: Record<NodeStatus, string> = {
  unknown: '#555566',
  healthy: DEFAULT_COLORS.cyan,
  degraded: DEFAULT_COLORS.amber,
  failed: DEFAULT_COLORS.error,
  deploying: '#2196F3',
  validating: '#64B5F6',
  validated: DEFAULT_COLORS.success,
  deployed: DEFAULT_COLORS.success,
}

/** Maps edge_type to color and style */
export const EDGE_TYPE_STYLES: Record<EdgeType, { color: string; dashArray: string; label: string }> = {
  data: { color: DEFAULT_COLORS.cyan, dashArray: '4 4', label: 'Data Flow' },
  control: { color: DEFAULT_COLORS.magenta, dashArray: '', label: 'Control' },
  event: { color: DEFAULT_COLORS.gold, dashArray: '2 6', label: 'Event' },
  api: { color: DEFAULT_COLORS.purple, dashArray: '8 4', label: 'API' },
}
