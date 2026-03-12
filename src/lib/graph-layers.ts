/**
 * pow3r.control - Graph Layer Visibility
 *
 * Purpose:
 * - Maps layerVisibility store to node/edge opacity
 * - Used by Graph2D and Graph3D
 */

export function getNodeLayerOpacity(
  node: { node_type: string; required_tests?: string[] },
  layerVisibility: Record<string, number>
): number {
  const topo = layerVisibility.topology ?? 1
  let layer = 1
  if (node.node_type === 'workflow') layer = layerVisibility.orchestration ?? 1
  else if (node.node_type === 'observer') layer = layerVisibility.observability ?? 1
  else if (node.node_type === 'agent' || node.node_type === 'data') layer = layerVisibility.intelligence ?? 1
  else if (node.node_type === 'component_factory') layer = layerVisibility.configuration ?? 1
  else if (node.node_type === 'gateway' || node.node_type === 'mcp_server') layer = layerVisibility.meta ?? 1
  else if ((node.required_tests?.length ?? 0) > 0) layer = Math.max(layer, layerVisibility.governance ?? 1)
  return topo * layer
}
