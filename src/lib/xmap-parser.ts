/**
 * pow3r.control - XMAP v7 Parser and v5 Adapter
 *
 * Purpose:
 * - Parse and validate XMAP v7 config JSON
 * - Adapt XMAP v5 configs to v7 normalized form
 * - Provide sample data for development/testing
 *
 * Agent Instructions:
 * - loadXmapConfig() is the primary entry point
 * - v5 configs detected by presence of `configId` field
 * - v7 configs detected by presence of `manifest` field
 */
import type { XmapV7Config, XmapNode, XmapEdge } from './types'

export function isXmapV7(data: Record<string, unknown>): boolean {
  return ('manifest' in data || ('metadata' in data && 'nodes' in data)) && Array.isArray(data.nodes)
}

export function isXmapV5(data: Record<string, unknown>): boolean {
  return 'configId' in data && !('manifest' in data)
}

/**
 * Adapts a v5 config object to v7 normalized form.
 * v5 nodes use `id` and `type`; v7 uses `node_id` and `node_type`.
 */
export function adaptV5ToV7(v5: Record<string, unknown>): XmapV7Config {
  const nodes: XmapNode[] = ((v5.nodes as Array<Record<string, unknown>>) ?? []).map((n) => ({
    node_id: (n.id as string) ?? (n.node_id as string) ?? '',
    node_type: mapV5NodeType((n.type as string) ?? (n.node_type as string) ?? 'service'),
    name: ((n.metadata as Record<string, unknown>)?.title as string) ?? (n.name as string) ?? '',
    description:
      ((n.metadata as Record<string, unknown>)?.description as string) ??
      (n.description as string) ??
      '',
    tech_stack: (n.tech_stack as string[]) ?? [],
    status: mapV5Status(
      ((n.developmentStatus as Record<string, unknown>)?.phase as string) ??
        (n.status as string) ??
        'unknown'
    ),
    owner: ((n.metadata as Record<string, unknown>)?.owner as string) ?? (n.owner as string),
  }))

  const edges: XmapEdge[] = ((v5.edges as Array<Record<string, unknown>>) ?? []).map((e) => ({
    edge_id: (e.id as string) ?? (e.edge_id as string) ?? '',
    from_node: ((e.from as Record<string, unknown>)?.nodeId as string) ?? (e.from_node as string) ?? '',
    to_node: ((e.to as Record<string, unknown>)?.nodeId as string) ?? (e.to_node as string) ?? '',
    edge_type: mapV5EdgeType((e.edgeType as string) ?? (e.edge_type as string) ?? 'data'),
  }))

  return {
    metadata: {
      id: (v5.configId as string) ?? 'unknown',
      version: (v5.version as string) ?? '1.0.0',
      created_at: new Date().toISOString(),
      created_by: 'v5-adapter',
    },
    manifest: {
      manifest_id: `${(v5.configId as string) ?? 'unknown'}-manifest`,
      manifest_version: '1.0.0',
      manifest_status: 'validated',
    },
    directorAgent: (v5.directorAgent as string) ?? undefined,
    nodes,
    edges,
    workflows: [],
    guardian: [],
    validator: [],
    tests: [],
    telemetry: [],
    config_controls: {},
    provenance: [],
    agent_views: [],
    ui_contracts: [],
    compliance: {
      compliance_score: 0,
      compliance_status: 'unknown',
    },
  }
}

function mapV5NodeType(type: string): XmapNode['node_type'] {
  const map: Record<string, XmapNode['node_type']> = {
    'repository.application': 'service',
    'repository.config': 'data',
    'repository.ui': 'ui',
    'repository.agent': 'agent',
    'repository.worker': 'gateway',
    'repository.tools': 'service',
    'component.feature': 'service',
    'component.service': 'service',
    'component.integration': 'gateway',
  }
  return map[type] ?? (type as XmapNode['node_type']) ?? 'service'
}

function mapV5Status(phase: string): XmapNode['status'] {
  const map: Record<string, XmapNode['status']> = {
    complete: 'healthy',
    'in-progress': 'deploying',
    planning: 'validating',
    blocked: 'failed',
    conceptual: 'unknown',
  }
  return map[phase] ?? (phase as XmapNode['status']) ?? 'unknown'
}

function mapV5EdgeType(type: string): XmapEdge['edge_type'] {
  const map: Record<string, XmapEdge['edge_type']> = {
    contains: 'data',
    uses: 'api',
    runsOn: 'control',
  }
  return map[type] ?? (type as XmapEdge['edge_type']) ?? 'data'
}

function str(v: unknown): string {
  if (v == null) return ''
  if (typeof v === 'string') return v
  if (typeof v === 'number' || typeof v === 'boolean') return String(v)
  return ''
}

function strArr(v: unknown): string[] {
  if (!Array.isArray(v)) return []
  return v.map((item) => str(item)).filter(Boolean)
}

function sanitizeNode(raw: Record<string, unknown>): XmapNode {
  return {
    node_id: str(raw.node_id ?? raw.id),
    node_type: (str(raw.node_type ?? raw.type) || 'service') as XmapNode['node_type'],
    name: str(raw.name) || str(raw.node_id ?? raw.id) || 'unnamed',
    description: str(raw.description) || undefined,
    tech_stack: strArr(raw.tech_stack),
    deployment_targets: strArr(raw.deployment_targets),
    status: (str(raw.status) || 'unknown') as XmapNode['status'],
    owner: str(raw.owner) || undefined,
    required_tests: strArr(raw.required_tests),
    telemetry_endpoints: strArr(raw.telemetry_endpoints),
    privileges: typeof raw.privileges === 'object' && raw.privileges !== null && !Array.isArray(raw.privileges)
      ? Object.fromEntries(Object.entries(raw.privileges as Record<string, unknown>).map(([k, v]) => [k, str(v)]))
      : undefined,
    immutable_flags: strArr(raw.immutable_flags),
    function: str(raw.function) || undefined,
    process_details: str(raw.process_details) || undefined,
    features: strArr(raw.features),
    integration: str(raw.integration) || undefined,
    best_practices: strArr(raw.best_practices),
    memory_pattern: str(raw.memory_pattern) || undefined,
    infrastructure: str(raw.infrastructure) || undefined,
    latency_target: str(raw.latency_target) || undefined,
    scaling: str(raw.scaling) || undefined,
    key_data_types: strArr(raw.key_data_types),
    line_types: strArr(raw.line_types),
  }
}

function sanitizeEdge(raw: Record<string, unknown>): XmapEdge {
  return {
    edge_id: str(raw.edge_id ?? raw.id),
    from_node: str(raw.from_node),
    to_node: str(raw.to_node),
    edge_type: (str(raw.edge_type) || 'data') as XmapEdge['edge_type'],
    permission_schema: typeof raw.permission_schema === 'object' && raw.permission_schema !== null
      ? Object.fromEntries(Object.entries(raw.permission_schema as Record<string, unknown>).map(([k, v]) => [k, str(v)]))
      : undefined,
    allowed_agents_roles: strArr(raw.allowed_agents_roles),
    encryption_policy: str(raw.encryption_policy) || undefined,
  }
}

export async function loadXmapConfig(source: string | Record<string, unknown>): Promise<XmapV7Config> {
  let data: Record<string, unknown>

  if (typeof source === 'string') {
    const res = await fetch(source)
    data = await res.json()
  } else {
    data = source
  }

  if (isXmapV7(data)) {
    const d = data as Record<string, unknown>
    const rawMeta = (d.metadata ?? {}) as Record<string, unknown>
    const rawManifest = (d.manifest ?? {}) as Record<string, unknown>
    const rawCompliance = (d.compliance ?? {}) as Record<string, unknown>

    d.metadata = {
      id: String(rawMeta.id ?? 'unknown'),
      version: String(rawMeta.version ?? '1.0.0'),
      created_at: String(rawMeta.created_at ?? rawMeta.createdAt ?? ''),
      created_by: String(rawMeta.created_by ?? rawMeta.createdBy ?? ''),
      last_modified_at: rawMeta.last_modified_at ? String(rawMeta.last_modified_at) : undefined,
      last_modified_by: rawMeta.last_modified_by ? String(rawMeta.last_modified_by) : undefined,
    }
    d.manifest = {
      manifest_id: String(rawManifest.manifest_id ?? rawManifest.manifestId ?? ''),
      manifest_version: String(rawManifest.manifest_version ?? rawManifest.manifestVersion ?? '1.0.0'),
      manifest_status: String(rawManifest.manifest_status ?? rawManifest.manifestStatus ?? 'validated'),
    }
    d.compliance = {
      compliance_score: typeof rawCompliance.compliance_score === 'number' ? rawCompliance.compliance_score : undefined,
      compliance_status: rawCompliance.compliance_status ? String(rawCompliance.compliance_status) : undefined,
    }
    if (!Array.isArray(d.nodes)) d.nodes = []
    if (!Array.isArray(d.edges)) d.edges = []
    if (!Array.isArray(d.workflows)) d.workflows = []
    if (!Array.isArray(d.guardian)) d.guardian = []
    if (!Array.isArray(d.validator)) d.validator = []
    if (!Array.isArray(d.tests)) d.tests = []
    if (!Array.isArray(d.telemetry)) d.telemetry = []
    if (!Array.isArray(d.provenance)) d.provenance = []
    if (!Array.isArray(d.agent_views)) d.agent_views = []
    if (!Array.isArray(d.ui_contracts)) d.ui_contracts = []
    if (!d.config_controls) d.config_controls = {}

    d.nodes = (d.nodes as Array<Record<string, unknown>>).map(sanitizeNode)
    d.edges = (d.edges as Array<Record<string, unknown>>).map(sanitizeEdge)

    return d as unknown as XmapV7Config
  }

  if (isXmapV5(data)) {
    return adaptV5ToV7(data)
  }

  throw new Error('Unrecognized config format: expected XMAP v5 or v7')
}
