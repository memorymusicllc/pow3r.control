/**
 * NodeGroup2D - SVG Group Boundary for Expanded Nodes
 *
 * Purpose:
 * - Renders a dashed circular boundary around child nodes of an expanded parent
 * - Shows parent label, collapse button, and telemetry path labels
 * - Computed from child positions after D3 force simulation tick
 *
 * Agent Instructions:
 * - Pass group boundary data + positions to this component
 * - It renders behind child nodes (lower z-order in SVG)
 * - Collapse button triggers collapseInlineNode in the store
 */
import { NODE_TYPE_COLORS, STATUS_COLORS } from '../../lib/types'
import type { GroupBoundary } from '../../lib/compound-graph'

interface NodeGroup2DProps {
  group: GroupBoundary
  cx: number
  cy: number
  radius: number
  onCollapse: (nodeId: string) => void
  /** Telemetry endpoint labels to show on the boundary */
  telemetryEndpoints?: string[]
}

export function NodeGroup2D({
  group,
  cx,
  cy,
  radius,
  onCollapse,
  telemetryEndpoints,
}: NodeGroup2DProps) {
  const typeColor = NODE_TYPE_COLORS[group.parentNode.node_type] ?? '#888'
  const statusColor = STATUS_COLORS[group.parentNode.status] ?? '#555'
  const safeRadius = Math.max(radius, 60)

  return (
    <g className="node-group-2d">
      {/* Outer glow ring */}
      <circle
        cx={cx}
        cy={cy}
        r={safeRadius + 8}
        fill="none"
        stroke={statusColor}
        strokeWidth={1}
        strokeDasharray="6 4"
        opacity={0.25}
      />

      {/* Main boundary circle */}
      <circle
        cx={cx}
        cy={cy}
        r={safeRadius}
        fill={`${typeColor}08`}
        stroke={typeColor}
        strokeWidth={1.5}
        strokeDasharray="8 6"
        opacity={0.6}
        className="transition-all duration-300"
      />

      {/* Group label at the top */}
      <g transform={`translate(${cx}, ${cy - safeRadius - 14})`}>
        <text
          textAnchor="middle"
          fill={typeColor}
          fontSize={12}
          fontFamily="monospace"
          fontWeight={600}
          opacity={0.9}
        >
          {group.parentNode.name}
        </text>

        {/* Status indicator */}
        <circle
          cx={-(group.parentNode.name.length * 3.5) - 10}
          cy={-4}
          r={4}
          fill={statusColor}
          opacity={0.8}
        />
      </g>

      {/* Collapse button (top-right of boundary) */}
      <g
        transform={`translate(${cx + safeRadius * 0.7}, ${cy - safeRadius - 6})`}
        className="cursor-pointer"
        onClick={(e) => {
          e.stopPropagation()
          onCollapse(group.parentNodeId)
        }}
      >
        <circle r={10} fill="var(--color-bg-card)" stroke={typeColor} strokeWidth={1} opacity={0.8} />
        <text
          textAnchor="middle"
          dominantBaseline="central"
          fill={typeColor}
          fontSize={12}
          fontFamily="monospace"
          fontWeight={600}
        >
          -
        </text>
      </g>

      {/* Telemetry path labels around the boundary */}
      {telemetryEndpoints && telemetryEndpoints.length > 0 && (
        <>
          {telemetryEndpoints.slice(0, 6).map((endpoint, i) => {
            const angle = (Math.PI * 0.3) + (i / Math.max(telemetryEndpoints.length, 1)) * Math.PI * 1.4
            const labelX = cx + Math.cos(angle) * (safeRadius + 22)
            const labelY = cy + Math.sin(angle) * (safeRadius + 22)
            return (
              <text
                key={endpoint}
                x={labelX}
                y={labelY}
                textAnchor="middle"
                fill="var(--color-text-muted)"
                fontSize={8}
                fontFamily="monospace"
                opacity={0.6}
              >
                {endpoint}
              </text>
            )
          })}
        </>
      )}

      {/* Child count badge (bottom center) */}
      <g transform={`translate(${cx}, ${cy + safeRadius + 14})`}>
        <text
          textAnchor="middle"
          fill="var(--color-text-muted)"
          fontSize={9}
          fontFamily="monospace"
          opacity={0.5}
        >
          {group.childNodeIds.size} nodes
        </text>
      </g>
    </g>
  )
}
