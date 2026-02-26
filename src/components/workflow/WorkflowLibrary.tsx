/**
 * pow3r.control - Workflow Library Module
 *
 * Purpose:
 * - Searchable grid of workflows
 * - Category/tag filters, run button, version selector, run history
 * - Data from config.workflows + workflow_library_list API when available
 */
import { useState, useMemo, useEffect } from 'react'
import { useControlStore } from '../../store/control-store'
import { fetchWorkflowsCombined, fetchWorkflowView } from '../../lib/workflow-library-api'
import type { XmapWorkflow, WorkflowType } from '../../lib/types'

const VALID_WORKFLOW_TYPES: WorkflowType[] = ['deployment', 'validation', 'self-heal', 'media-generation', 'test']

function toWorkflowType(s: string | undefined): WorkflowType {
  if (!s) return 'deployment'
  const t = s.toLowerCase()
  return VALID_WORKFLOW_TYPES.includes(t as WorkflowType) ? (t as WorkflowType) : 'deployment'
}

export interface WorkflowLibraryProps {
  onRun?: (workflowId: string) => void
  onViewLive?: (workflowId: string) => void
  onView?: (workflowId: string, definition: Record<string, unknown>) => void
}

export function WorkflowLibrary({ onRun, onViewLive, onView }: WorkflowLibraryProps) {
  const config = useControlStore((s) => s.config)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<WorkflowType | 'all'>('all')
  const [apiWorkflows, setApiWorkflows] = useState<XmapWorkflow[]>([])
  const [viewingWorkflowId, setViewingWorkflowId] = useState<string | null>(null)
  const [viewingDefinition, setViewingDefinition] = useState<Record<string, unknown> | null>(null)

  useEffect(() => {
    let cancelled = false
    fetchWorkflowsCombined().then((res) => {
      if (cancelled) return
      const list: XmapWorkflow[] = (res.workflows ?? []).map((w) => ({
        workflow_id: w.id || w.workflowId || '',
        workflow_type: toWorkflowType(w.workflow_type),
      }))
      setApiWorkflows(list)
    }).catch(() => {})
    return () => { cancelled = true }
  }, [])

  const workflows = useMemo(() => {
    const configList = config?.workflows ?? []
    const byId = new Map<string, XmapWorkflow>()
    for (const w of configList) byId.set(w.workflow_id, w)
    for (const w of apiWorkflows) if (w.workflow_id && !byId.has(w.workflow_id)) byId.set(w.workflow_id, w)
    return Array.from(byId.values())
  }, [config?.workflows, apiWorkflows])

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

  const handleView = async (workflowId: string) => {
    setViewingWorkflowId(workflowId)
    setViewingDefinition(null)
    const def = await fetchWorkflowView(workflowId)
    setViewingDefinition(def ?? { error: 'Workflow not found' })
    onView?.(workflowId, def ?? {})
  }

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
            onView={() => handleView(wf.workflow_id)}
          />
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="text-[var(--color-text-muted)] font-mono text-sm">No workflows match.</p>
      )}

      {viewingWorkflowId && (
        <WorkflowViewModal
          workflowId={viewingWorkflowId}
          definition={viewingDefinition}
          onClose={() => { setViewingWorkflowId(null); setViewingDefinition(null) }}
        />
      )}
    </div>
  )
}

function WorkflowViewModal({
  workflowId,
  definition,
  onClose,
}: {
  workflowId: string
  definition: Record<string, unknown> | null
  onClose: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onClose}>
      <div
        className="max-w-2xl max-h-[80vh] w-full mx-4 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-panel)] shadow-xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-2 border-b border-[var(--color-border)]">
          <code className="font-mono text-sm text-[var(--color-cyan)]">{workflowId}</code>
          <button onClick={onClose} className="font-mono text-[10px] px-2 py-1 rounded text-[var(--color-text-muted)] hover:bg-[var(--color-bg-card)]">Close</button>
        </div>
        <pre className="flex-1 overflow-auto p-4 font-mono text-[10px] text-[var(--color-text-secondary)] whitespace-pre-wrap">
          {definition ? JSON.stringify(definition, null, 2) : 'Loading...'}
        </pre>
      </div>
    </div>
  )
}

function WorkflowCard({
  workflow,
  onRun,
  onViewLive,
  onView,
}: {
  workflow: XmapWorkflow
  onRun: () => void
  onViewLive: () => void
  onView: () => void
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
      <div className="flex items-center gap-2 mt-2 flex-wrap">
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
        <button
          onClick={onView}
          className="font-mono text-[9px] px-2 py-1 rounded bg-[var(--color-purple)]20 text-[var(--color-purple)] hover:bg-[var(--color-purple)]30"
        >
          View
        </button>
      </div>
    </div>
  )
}
