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
    if (!d.manifest) {
      d.manifest = {
        manifest_id: `${(d.metadata as Record<string, unknown>)?.id ?? 'unknown'}-manifest`,
        manifest_version: '1.0.0',
        manifest_status: 'validated',
      }
    }
    if (!d.guardian) d.guardian = []
    return d as unknown as XmapV7Config
  }

  if (isXmapV5(data)) {
    return adaptV5ToV7(data)
  }

  throw new Error('Unrecognized config format: expected XMAP v5 or v7')
}
