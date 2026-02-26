/**
 * pow3r.control - Expansion Breadcrumb Trail
 *
 * Purpose:
 * - Shows drill-down path: Platform > node > workflow
 * - Click to navigate back to any level
 */
import { useNodeExpansion } from '../../context/NodeExpansionContext'
import { useControlStore } from '../../store/control-store'

export function ExpansionBreadcrumb() {
  const { expansionStack, clearExpansion, goToExpansion } = useNodeExpansion()
  const config = useControlStore((s) => s.config)

  if (expansionStack.length === 0) return null

  const items: { id: string; label: string }[] = []
  items.push({ id: 'root', label: 'Platform' })
  for (const nodeId of expansionStack) {
    const node = config?.nodes.find((n) => n.node_id === nodeId)
    items.push({ id: nodeId, label: node?.name ?? nodeId })
  }

  return (
    <div className="flex items-center gap-1 font-mono text-[10px] text-[var(--color-text-muted)]">
      {items.map((item, i) => (
        <span key={item.id} className="flex items-center gap-1">
          {i > 0 && <span className="text-[var(--color-border)]">/</span>}
          {i === items.length - 1 && i > 0 ? (
            <span className="text-[var(--color-cyan)]">{item.label}</span>
          ) : (
            <button
              onClick={() => (item.id === 'root' ? clearExpansion() : goToExpansion(item.id))}
              className="hover:text-[var(--color-cyan)] transition-colors"
            >
              {item.label}
            </button>
          )}
        </span>
      ))}
    </div>
  )
}
