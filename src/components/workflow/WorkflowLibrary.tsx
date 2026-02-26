/**
 * pow3r.control - Workflow Library Module
 *
 * Purpose:
 * - Searchable grid of workflows
 * - Category/tag filters, run button, version selector, run history
 * - Data from config.workflows + workflow_library_list when available
 */
import { useState, useMemo } from 'react'
import { useControlStore } from '../../store/control-store'
import type { XmapWorkflow, WorkflowType } from '../../lib/types'

export interface WorkflowLibraryProps {
  onRun?: (workflowId: string) => void
  onViewLive?: (workflowId: string) => void
}

export function WorkflowLibrary({ onRun, onViewLive }: WorkflowLibraryProps) {
  const config = useControlStore((s) => s.config)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<WorkflowType | 'all'>('all')

  const workflows = config?.workflows ?? []

  const filtered = useMemo(() => {
    let list = [...workflows]
    if (search) {
      const q = search.toLowerCase()
      list = list.filter(
        (w) =>
          w.workflow_id.toLowerCase().includes(q) ||
          w.workflow_type.toLowerCase().includes(q)
      )
    }
    if (categoryFilter !== 'all') {
      list = list.filter((w) => w.workflow_type === categoryFilter)
    }
    return list
  }, [workflows, search, categoryFilter])

  const categories = useMemo(() => {
    const set = new Set(workflows.map((w) => w.workflow_type))
    return Array.from(set)
  }, [workflows])

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <input
          type="search"
          placeholder="Search workflows..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-3 py-1.5 rounded bg-[var(--color-bg-card)] border border-[var(--color-border)] font-mono text-sm text-[var(--color-text-primary)] focus:border-[var(--color-cyan)] outline-none"
        />
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value as WorkflowType | 'all')}
          className="px-3 py-1.5 rounded bg-[var(--color-bg-card)] border border-[var(--color-border)] font-mono text-sm text-[var(--color-text-primary)]"
        >
          <option value="all">All categories</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3" style={{ maxWidth: 520 }}>
        {filtered.map((wf) => (
          <WorkflowCard
            key={wf.workflow_id}
            workflow={wf}
            onRun={() => onRun?.(wf.workflow_id)}
            onViewLive={() => onViewLive?.(wf.workflow_id)}
          />
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="text-[var(--color-text-muted)] font-mono text-sm">No workflows match.</p>
      )}
    </div>
  )
}

function WorkflowCard({
  workflow,
  onRun,
  onViewLive,
}: {
  workflow: XmapWorkflow
  onRun: () => void
  onViewLive: () => void
}) {
  return (
    <div className="p-3 rounded border border-[var(--color-border)] bg-[var(--color-bg-card)] hover:border-[var(--color-cyan)] transition-colors">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <code className="font-mono text-[11px] text-[var(--color-cyan)] truncate block">
            {workflow.workflow_id}
          </code>
          <span className="font-mono text-[9px] text-[var(--color-text-muted)] mt-0.5 block">
            {workflow.workflow_type}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-2 mt-2">
        <button
          onClick={onRun}
          className="font-mono text-[9px] px-2 py-1 rounded bg-[var(--color-cyan)]20 text-[var(--color-cyan)] hover:bg-[var(--color-cyan)]30"
        >
          Run
        </button>
        <button
          onClick={onViewLive}
          className="font-mono text-[9px] px-2 py-1 rounded bg-[var(--color-amber)]20 text-[var(--color-amber)] hover:bg-[var(--color-amber)]30"
        >
          Live
        </button>
      </div>
    </div>
  )
}
