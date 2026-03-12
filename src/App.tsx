/**
 * pow3r.control - App Shell
 *
 * Purpose:
 * - Root application component
 * - Loads XMAP v7 config, renders graph + panels + controls
 * - Bottom nav bar layout (per user design rules)
 *
 * Agent Instructions:
 * - Uses React+Vite (NO Next.js -- Guardian STRICT)
 * - Bottom nav bar fixed to bottom, responsive
 * - Max card width 520px per dashboard rules
 */
import { useEffect, useState } from 'react'
import { useControlStore } from './store/control-store'
import { loadConfigByName } from './lib/config-loader'
import { NodeExpansionProvider } from './context/NodeExpansionContext'
import { Graph2D } from './components/graph/Graph2D'
import { Graph3D } from './components/graph/Graph3D'
import { TimelineView } from './components/graph/TimelineView'
import { NodeDetail } from './components/panels/NodeDetail'
import { EdgeDetail } from './components/panels/EdgeDetail'
import { MapKey } from './components/panels/MapKey'
import { GuardianDashboard } from './components/panels/GuardianDashboard'
import { WorkflowExpander } from './components/panels/WorkflowExpander'
import { TelemetryStream } from './components/panels/TelemetryStream'
import { PKGOverlay } from './components/panels/PKGOverlay'
import { XFilesPanel } from './components/panels/XFilesPanel'
import { DashboardGrid } from './components/dashboard/DashboardGrid'
import { ConfigSelector } from './components/controls/ConfigSelector'
import { SearchBar } from './components/controls/SearchBar'
import { ViewSwitcher } from './components/controls/ViewSwitcher'
import { ControlSurface } from './components/controls/ControlSurface'
import { useXSystemStore } from './store/x-system-store'
import { useWorkflowExecutionStore } from './store/workflow-execution-store'
import { connectXSystemSSE } from './lib/x-system-sse'
import { ExpandedNodeView } from './components/expansion/ExpandedNodeView'
import { ExpansionBreadcrumb } from './components/expansion/ExpansionBreadcrumb'
import { WorkflowOrchestratorLive } from './components/workflow/WorkflowOrchestratorLive'
import { WorkflowLibrary } from './components/workflow/WorkflowLibrary'
import { AbacusDashboard } from './components/abacus/AbacusDashboard'
import { AgentManagement } from './components/agents/AgentManagement'
import { CursorStatus } from './components/cursor/CursorStatus'
import { ConfigLeafViewer } from './components/panels/ConfigLeafViewer'
import { MCPPlayground } from './components/playground/MCPPlayground'
import { PDAMView } from './components/pdam/PDAMView'
import { MCPMonitorView } from './components/mcp-monitor/MCPMonitorView'
import { DataKnowledgeView } from './components/data/DataKnowledgeView'
import { OSCViewLayout } from './components/layout/OSCViewLayout'
import { ErrorBoundary } from './components/ErrorBoundary'
import { ThemeToggle } from './components/controls/ThemeToggle'
import { ReviewToggle } from './components/controls/ReviewToggle'
import { ThemeSync } from './components/ThemeSync'
import { ViewPanelMenu } from './components/controls/ViewPanelMenu'
import { useLayoutMode } from './hooks/useLayoutMode'
import {
  selectFilteredNodes,
  selectFilteredEdges,
  selectWorkflows,
  selectGuardianGates,
} from './store/control-store'

function safeText(value: unknown): string {
  if (value == null) return ''
  if (typeof value === 'string') return value
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  return ''
}

export default function App() {
  const loadConfig = useControlStore((s) => s.loadConfig)
  const config = useControlStore((s) => s.config)
  const viewMode = useControlStore((s) => s.viewMode)
  const selectedNodeId = useControlStore((s) => s.selectedNodeId)
  const selectedEdgeId = useControlStore((s) => s.selectedEdgeId)
  const showMapKey = useControlStore((s) => s.showMapKey)
  const toggleMapKey = useControlStore((s) => s.toggleMapKey)
  const showGuardianDashboard = useControlStore((s) => s.showGuardianDashboard)
  const toggleGuardianDashboard = useControlStore((s) => s.toggleGuardianDashboard)
  const expandedWorkflowId = useControlStore((s) => s.expandedWorkflowId)
  const expandedNodeId = useControlStore((s) => s.expandedNodeId)
  const [orchestratorLiveWorkflowId, setOrchestratorLiveWorkflowId] = useState<string | null>(null)
  const [showConfigLeafViewer, setShowConfigLeafViewer] = useState(false)
  const [showWorkflowsWidget, setShowWorkflowsWidget] = useState(true)
  const expandWorkflow = useControlStore((s) => s.expandWorkflow)
  const showGovernanceOverlay = useControlStore((s) => s.showGovernanceOverlay)
  const toggleGovernanceOverlay = useControlStore((s) => s.toggleGovernanceOverlay)
  const inlineExpandedNodeIds = useControlStore((s) => s.inlineExpandedNodeIds)
  const collapseAllInline = useControlStore((s) => s.collapseAllInline)
  const isReviewMode = useControlStore((s) => s.isReviewMode)
  const showControlSurface = useControlStore((s) => s.showControlSurface)
  const toggleControlSurface = useControlStore((s) => s.toggleControlSurface)
  const showCanvasInstructions = useControlStore((s) => s.showCanvasInstructions)
  const toggleCanvasInstructions = useControlStore((s) => s.toggleCanvasInstructions)

  const toggleTelemetryPanel = useXSystemStore((s) => s.toggleTelemetryPanel)
  const showTelemetryPanel = useXSystemStore((s) => s.showTelemetryPanel)
  const toggleXFilesPanel = useXSystemStore((s) => s.toggleXFilesPanel)
  const showXFilesPanel = useXSystemStore((s) => s.showXFilesPanel)
  const xEventCount = useXSystemStore((s) => s.eventCount)
  const xFilesCases = useXSystemStore((s) => s.xfilesCases)
  const addEvent = useXSystemStore((s) => s.addEvent)
  const setConnected = useXSystemStore((s) => s.setConnected)
  const startSimulation = useXSystemStore((s) => s.startSimulation)
  const stopSimulation = useXSystemStore((s) => s.stopSimulation)
  const updateStepFromEvent = useWorkflowExecutionStore((s) => s.updateStepFromEvent)

  const viewPanelItems = [
    { id: 'gates', label: 'Gates', isActive: showGuardianDashboard, onToggle: toggleGuardianDashboard },
    {
      id: 'xlog',
      label: 'X-Log',
      isActive: showTelemetryPanel,
      onToggle: toggleTelemetryPanel,
      badge: xEventCount,
    },
    {
      id: 'xfiles',
      label: 'X-Files',
      isActive: showXFilesPanel,
      onToggle: toggleXFilesPanel,
      badge: xFilesCases.filter((c) => c.status !== 'closed').length || undefined,
    },
    { id: 'gov', label: 'Gov', isActive: showGovernanceOverlay, onToggle: toggleGovernanceOverlay },
    {
      id: 'wf',
      label: 'WF',
      isActive: showWorkflowsWidget,
      onToggle: () => setShowWorkflowsWidget((w) => !w),
    },
    { id: 'legend', label: 'Legend', isActive: showMapKey, onToggle: toggleMapKey },
    {
      id: 'config',
      label: 'Config',
      isActive: showConfigLeafViewer,
      onToggle: () => setShowConfigLeafViewer((v) => !v),
    },
    { id: 'mix', label: 'MIX', isActive: showControlSurface, onToggle: toggleControlSurface },
    {
      id: 'canvas',
      label: 'Canvas instructions',
      isActive: showCanvasInstructions,
      onToggle: toggleCanvasInstructions,
    },
  ]

  const layout = useLayoutMode()

  const [configError, setConfigError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      setConfigError(null)
      try {
        const config = await loadConfigByName('platform-expansion')
        if (!cancelled) loadConfig(config)
      } catch (err) {
        if (cancelled) return
        console.warn('[pow3r.control] platform-expansion failed, trying platform-v7:', err)
        try {
          const config = await loadConfigByName('platform-v7')
          if (!cancelled) loadConfig(config)
        } catch (e) {
          if (cancelled) return
          console.error('[pow3r.control] Config load failed:', e)
          setConfigError(e instanceof Error ? e.message : 'Config load failed')
        }
      }
    }
    load()
    startSimulation()
    return () => {
      cancelled = true
      stopSimulation()
    }
  }, [loadConfig, startSimulation, stopSimulation])

  useEffect(() => {
    const dispose = connectXSystemSSE({
      onEvent: (ev) => {
        addEvent(ev)
        const d = ev.data as Record<string, unknown> | undefined
        if (d && typeof d.workflowId === 'string' && typeof d.stepId === 'string') {
          const status = (d.status as 'pending' | 'running' | 'success' | 'fail') ?? (ev.severity === 'high' || ev.severity === 'critical' ? 'fail' as const : 'success' as const)
          updateStepFromEvent(d.workflowId, d.stepId, status, {
            startedAt: typeof d.startedAt === 'string' ? d.startedAt : undefined,
            completedAt: typeof d.completedAt === 'string' ? d.completedAt : undefined,
            durationMs: typeof d.durationMs === 'number' ? d.durationMs : undefined,
            error: typeof d.error === 'string' ? d.error : undefined,
          })
        }
      },
      onConnect: () => setConnected(true),
      onDisconnect: () => setConnected(false),
    })
    return dispose
  }, [addEvent, setConnected, updateStepFromEvent])

  if (!config) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-[var(--color-bg-deep)]">
        <div className="text-center max-w-md px-4">
          {configError ? (
            <>
              <p className="font-mono text-sm text-red-400 mb-2">Config load failed</p>
              <p className="font-mono text-xs text-[var(--color-text-muted)] mb-4">{configError}</p>
              <p className="font-mono text-[10px] text-[var(--color-text-muted)]">
                Check config.superbots.link is reachable. Try Config selector when available.
              </p>
            </>
          ) : (
            <>
              <div className="w-8 h-8 border-2 border-[var(--color-cyan)] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="font-mono text-xs text-[var(--color-text-muted)]">Loading XMAP v7 config...</p>
            </>
          )}
        </div>
      </div>
    )
  }

  return (
    <NodeExpansionProvider>
    <ThemeSync />
    <div className="w-full h-full flex flex-col bg-[var(--color-bg-deep)]" data-review={isReviewMode ? 'true' : undefined}>
      {/* Top bar - responsive: compact on mobile, full on desktop */}
      <header className="flex items-center justify-between px-3 py-2 bg-[var(--color-bg-surface)] border-b border-[var(--color-border)] z-30 shrink-0 gap-2">
        <div className="flex items-center gap-2 min-w-0 shrink-0">
          <h1 className="font-mono text-sm font-bold tracking-tight whitespace-nowrap">
            <span className="text-[var(--color-cyan)]">pow3r</span>
            <span className="text-[var(--color-text-muted)]">.</span>
            <span className="text-[var(--color-text-primary)]">control</span>
          </h1>
          {layout.breakpoint !== 'compact' && config.metadata && (
            <>
              <div className="h-4 w-px bg-[var(--color-border)]" />
              <span className="font-mono text-[10px] text-[var(--color-text-muted)] truncate max-w-[120px]">
                {safeText(config.metadata?.id)} v{safeText(config.metadata?.version)}
              </span>
            </>
          )}
          {config.manifest?.manifest_status && layout.breakpoint !== 'compact' && (
            <span
              className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-semibold uppercase ${
                config.manifest.manifest_status === 'deployed'
                  ? 'bg-[#00E67620] text-[var(--color-success)]'
                  : config.manifest.manifest_status === 'validated'
                    ? 'bg-[#00E5FF20] text-[var(--color-cyan)]'
                    : 'bg-[#FFB30020] text-[var(--color-amber)]'
              }`}
            >
              {safeText(config.manifest?.manifest_status)}
            </span>
          )}
          {layout.breakpoint !== 'compact' && <ConfigSelector />}
        </div>

        <div className="flex items-center gap-2 min-w-0">
          {layout.breakpoint !== 'compact' && <ReviewToggle />}
          <ThemeToggle />
          {layout.breakpoint !== 'compact' && <ExpansionBreadcrumb />}
          <SearchBar compact={layout.breakpoint === 'compact'} />
          {layout.breakpoint !== 'compact' && <FilteredStatsBar compact={false} />}
        </div>
      </header>

      {/* Body: sidebar (landscape) + main */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Left nav - landscape only (CSS media query) */}
        <aside className="nav-sidebar hidden w-16 shrink-0 flex-col items-center gap-2 border-r border-[var(--color-border)] bg-[var(--color-bg-surface)] py-3">
          <ViewSwitcher orientation="vertical" />
          <div className="mt-auto flex flex-col gap-2">
            {config.compliance?.compliance_score !== undefined && (
              <div className="flex flex-col items-center gap-0.5">
                <span className="font-mono text-[8px] text-[var(--color-text-muted)]">Comp</span>
                <span className="font-mono text-[10px] text-[var(--color-text-secondary)]">
                  {Math.round((config.compliance?.compliance_score ?? 0) * 100)}%
                </span>
              </div>
            )}
            <ViewPanelMenu placement="right" panels={viewPanelItems} />
          </div>
        </aside>

        {/* Main content area */}
        <main className="flex-1 relative overflow-hidden">
        {viewMode === '2d' && <Graph2D />}
        {viewMode === '3d' && <Graph3D />}
        {viewMode === 'timeline' && <TimelineView />}
        {viewMode === 'dashboard' && <DashboardGrid />}
        {viewMode === 'abacus' && (
          <div className="w-full h-full overflow-auto">
            <OSCViewLayout title="Abacus">
              <AbacusDashboard />
            </OSCViewLayout>
          </div>
        )}
        {viewMode === 'agents' && (
          <div className="w-full h-full overflow-auto">
            <OSCViewLayout title="Agents">
              <AgentManagement />
            </OSCViewLayout>
          </div>
        )}
        {viewMode === 'cursor' && (
          <div className="w-full h-full overflow-auto">
            <CursorStatus />
          </div>
        )}
        {viewMode === 'library' && (
          <div className="w-full h-full overflow-auto">
            <ErrorBoundary>
              <OSCViewLayout
                title="Library"
                onClose={() => useControlStore.getState().setViewMode('2d')}
              >
                <WorkflowLibrary
                  onRun={(id) => setOrchestratorLiveWorkflowId(id)}
                  onViewLive={(id) => setOrchestratorLiveWorkflowId(id)}
                />
              </OSCViewLayout>
            </ErrorBoundary>
          </div>
        )}
        {viewMode === 'playground' && (
          <div className="w-full h-full overflow-auto">
            <MCPPlayground />
          </div>
        )}
        {viewMode === 'pdam' && (
          <div className="w-full h-full overflow-auto">
            <OSCViewLayout title="PDAM">
              <PDAMView />
            </OSCViewLayout>
          </div>
        )}
        {viewMode === 'mcp-monitor' && (
          <div className="w-full h-full overflow-auto">
            <OSCViewLayout title="MCP Monitor">
              <MCPMonitorView />
            </OSCViewLayout>
          </div>
        )}
        {viewMode === 'data' && (
          <div className="w-full h-full overflow-auto">
            <OSCViewLayout title="Data & Knowledge">
              <DataKnowledgeView />
            </OSCViewLayout>
          </div>
        )}

        {/* Workflow Orchestrator Live (fullscreen) */}
        {orchestratorLiveWorkflowId && (
          <ErrorBoundary
            fallback={
              <div className="absolute inset-0 z-30 bg-[var(--color-bg-deep)] flex flex-col items-center justify-center p-6">
                <p className="font-mono text-sm text-[var(--color-error)]">Workflow Live failed to load.</p>
                <button
                  onClick={() => setOrchestratorLiveWorkflowId(null)}
                  className="mt-4 font-mono text-[10px] px-4 py-2 rounded bg-[var(--color-cyan)]20 text-[var(--color-cyan)]"
                >
                  Close
                </button>
              </div>
            }
          >
            <WorkflowOrchestratorLive
              workflowId={orchestratorLiveWorkflowId}
              onClose={() => setOrchestratorLiveWorkflowId(null)}
            />
          </ErrorBoundary>
        )}

        {/* Expansion panel */}
        {expandedNodeId && !showGuardianDashboard && !expandedWorkflowId && !orchestratorLiveWorkflowId && <ExpandedNodeView />}

        {/* Governance panels */}
        {showGuardianDashboard && <GuardianDashboard />}
        {expandedWorkflowId && !showGuardianDashboard && !orchestratorLiveWorkflowId && <WorkflowExpander />}

        {/* Detail panels */}
        {selectedNodeId && !showGuardianDashboard && !expandedWorkflowId && <NodeDetail />}
        {selectedEdgeId && !selectedNodeId && !showGuardianDashboard && !expandedWorkflowId && <EdgeDetail />}

        {/* PKG Knowledge Overlay (Layer 5: Intelligence) */}
        <PKGOverlay />

        {/* X-Files panel */}
        {showXFilesPanel && !showGuardianDashboard && !expandedWorkflowId && <XFilesPanel />}

        {/* Map key */}
        <MapKey />

        {/* Control Surface */}
        <ControlSurface />

        {/* Telemetry stream (bottom panel) */}
        <TelemetryStream />

        {/* Config Leaf Viewer */}
        {showConfigLeafViewer && (
          <ConfigLeafViewer
            selectedNodeId={selectedNodeId}
            config={config}
            onClose={() => setShowConfigLeafViewer(false)}
          />
        )}

        {/* Workflow quick-access: show workflows from config */}
        {(config.workflows?.length ?? 0) > 0 && !expandedWorkflowId && !showGuardianDashboard && !orchestratorLiveWorkflowId && showWorkflowsWidget && (
          <div className="absolute top-2 left-2 z-10">
            <div className="bg-[var(--color-bg-panel)] border border-[var(--color-border)] rounded-lg p-2 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[9px] text-[var(--color-text-muted)] uppercase tracking-wider">
                  Workflows
                </span>
                <button
                  onClick={() => setShowWorkflowsWidget(false)}
                  className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] text-xs leading-none px-1"
                  title="Hide workflows widget"
                >
                  ×
                </button>
              </div>
              {(config.workflows ?? []).map((wf) => (
                <div key={wf.workflow_id} className="flex items-center gap-1">
                  <button
                    onClick={() => expandWorkflow(wf.workflow_id)}
                    className="flex-1 text-left px-2 py-1 rounded text-[10px] font-mono text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-card)] hover:text-[var(--color-cyan)] transition-colors"
                  >
                    {wf.workflow_id}
                    <span className="ml-1 text-[8px] text-[var(--color-text-muted)]">
                      ({wf.workflow_type})
                    </span>
                  </button>
                  <button
                    onClick={() => setOrchestratorLiveWorkflowId(wf.workflow_id)}
                    className="font-mono text-[8px] px-1.5 py-0.5 rounded text-[var(--color-amber)] hover:bg-[var(--color-bg-card)]"
                    title="Open Orchestrator Live"
                  >
                    Live
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
        </main>
      </div>

      {/* Bottom nav - portrait only (CSS media query) */}
      <footer className="nav-footer flex items-center justify-between px-4 py-2 bg-[var(--color-bg-surface)] border-t border-[var(--color-border)] z-30 shrink-0">
        <ViewSwitcher />

        <div className="flex items-center gap-2">
          {inlineExpandedNodeIds.size > 0 && (
            <button
              onClick={collapseAllInline}
              className="font-mono text-[9px] px-2 py-1 rounded transition-colors text-[var(--color-amber)] bg-[var(--color-bg-card)] hover:bg-[var(--color-amber)]/20 border border-[var(--color-amber)]/30 min-h-[32px] min-w-[32px] flex items-center justify-center"
              title={`Collapse ${inlineExpandedNodeIds.size} expanded node${inlineExpandedNodeIds.size > 1 ? 's' : ''}`}
            >
              Collapse All ({inlineExpandedNodeIds.size})
            </button>
          )}
          {config.compliance?.compliance_score !== undefined && (
            <div className="flex items-center gap-1.5 min-h-[32px]">
              <span className="font-mono text-[9px] text-[var(--color-text-muted)]">Compliance</span>
              <div className="w-16 h-1.5 bg-[var(--color-bg-card)] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${(config.compliance?.compliance_score ?? 0) * 100}%`,
                    backgroundColor:
                      (config.compliance?.compliance_score ?? 0) > 0.8
                        ? 'var(--color-success)'
                        : (config.compliance?.compliance_score ?? 0) > 0.5
                          ? 'var(--color-amber)'
                          : 'var(--color-error)',
                  }}
                />
              </div>
              <span className="font-mono text-[10px] text-[var(--color-text-secondary)]">
                {Math.round((config.compliance?.compliance_score ?? 0) * 100)}%
              </span>
            </div>
          )}

          <ViewPanelMenu placement="top" panels={viewPanelItems} />
        </div>
      </footer>
    </div>
    </NodeExpansionProvider>
  )
}

/** Filter count on search results: nodes, edges, wf, gates (next to search bar) */
function FilteredStatsBar({ compact = false }: { compact?: boolean }) {
  const nodes = useControlStore(selectFilteredNodes)
  const edges = useControlStore(selectFilteredEdges)
  const workflows = useControlStore(selectWorkflows)
  const gates = useControlStore(selectGuardianGates)

  if (compact) {
    return (
      <div className="flex items-center gap-1.5 font-mono text-[9px] text-[var(--color-text-muted)]">
        <span className="text-[var(--color-text-secondary)]">{nodes.length}</span>n
        <span className="text-[var(--color-text-secondary)]">{edges.length}</span>e
        <span className="text-[var(--color-text-secondary)]">{workflows.length}</span>wf
        <span className="text-[var(--color-text-secondary)]">{gates.length}</span>g
      </div>
    )
  }

  return (
    <div className="flex items-center gap-3 font-mono text-[10px] text-[var(--color-text-muted)]">
      <span>
        <span className="text-[var(--color-text-secondary)]">{nodes.length}</span> nodes
      </span>
      <span>
        <span className="text-[var(--color-text-secondary)]">{edges.length}</span> edges
      </span>
      <span>
        <span className="text-[var(--color-text-secondary)]">{workflows.length}</span> wf
      </span>
      <span>
        <span className="text-[var(--color-text-secondary)]">{gates.length}</span> gates
      </span>
    </div>
  )
}
