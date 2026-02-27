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
import { SAMPLE_CONFIG } from './lib/sample-data'
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
  const expandWorkflow = useControlStore((s) => s.expandWorkflow)
  const showGovernanceOverlay = useControlStore((s) => s.showGovernanceOverlay)
  const toggleGovernanceOverlay = useControlStore((s) => s.toggleGovernanceOverlay)
  const inlineExpandedNodeIds = useControlStore((s) => s.inlineExpandedNodeIds)
  const collapseAllInline = useControlStore((s) => s.collapseAllInline)

  const isXConnected = useXSystemStore((s) => s.isConnected)
  const xEventCount = useXSystemStore((s) => s.eventCount)
  const xFilesCases = useXSystemStore((s) => s.xfilesCases)
  const toggleTelemetryPanel = useXSystemStore((s) => s.toggleTelemetryPanel)
  const showTelemetryPanel = useXSystemStore((s) => s.showTelemetryPanel)
  const toggleXFilesPanel = useXSystemStore((s) => s.toggleXFilesPanel)
  const showXFilesPanel = useXSystemStore((s) => s.showXFilesPanel)
  const addEvent = useXSystemStore((s) => s.addEvent)
  const setConnected = useXSystemStore((s) => s.setConnected)
  const startSimulation = useXSystemStore((s) => s.startSimulation)
  const stopSimulation = useXSystemStore((s) => s.stopSimulation)
  const updateStepFromEvent = useWorkflowExecutionStore((s) => s.updateStepFromEvent)

  useEffect(() => {
    loadConfig(SAMPLE_CONFIG)
    startSimulation()
    return () => stopSimulation()
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
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-[var(--color-cyan)] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="font-mono text-xs text-[var(--color-text-muted)]">Loading XMAP v7 config...</p>
        </div>
      </div>
    )
  }

  return (
    <NodeExpansionProvider>
    <div className="w-full h-full flex flex-col bg-[var(--color-bg-deep)]">
      {/* Top bar */}
      <header className="flex items-center justify-between px-4 py-2 bg-[var(--color-bg-surface)] border-b border-[var(--color-border)] z-30 shrink-0">
        <div className="flex items-center gap-3">
          <h1 className="font-mono text-sm font-bold tracking-tight">
            <span className="text-[var(--color-cyan)]">pow3r</span>
            <span className="text-[var(--color-text-muted)]">.</span>
            <span className="text-[var(--color-text-primary)]">control</span>
          </h1>
          <div className="h-4 w-px bg-[var(--color-border)]" />
          <span className="font-mono text-[10px] text-[var(--color-text-muted)]">
            {config.metadata.id} v{config.metadata.version}
          </span>
          {config.manifest.manifest_status && (
            <span
              className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-semibold uppercase ${
                config.manifest.manifest_status === 'deployed'
                  ? 'bg-[#00E67620] text-[var(--color-success)]'
                  : config.manifest.manifest_status === 'validated'
                    ? 'bg-[#00E5FF20] text-[var(--color-cyan)]'
                    : 'bg-[#FFB30020] text-[var(--color-amber)]'
              }`}
            >
              {config.manifest.manifest_status}
            </span>
          )}
          <ConfigSelector />
        </div>

        <div className="flex items-center gap-3">
          <ExpansionBreadcrumb />
          <SearchBar />
          <StatsBar config={config} />
          <button
            onClick={() => setShowConfigLeafViewer((v) => !v)}
            className={`font-mono text-[9px] px-2 py-1 rounded transition-colors ${
              showConfigLeafViewer ? 'text-[var(--color-purple)] bg-[var(--color-bg-card)]' : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]'
            }`}
            title="Config Leaf"
          >
            Config
          </button>
          <button
            onClick={useControlStore.getState().toggleControlSurface}
            className={`font-mono text-[9px] px-2 py-1 rounded transition-colors ${
              useControlStore.getState().showControlSurface
                ? 'text-[var(--color-cyan)] bg-[var(--color-bg-card)]'
                : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]'
            }`}
            title="Control Surface"
          >
            MIX
          </button>
        </div>
      </header>

      {/* Main content area */}
      <main className="flex-1 relative overflow-hidden">
        {viewMode === '2d' && <Graph2D />}
        {viewMode === '3d' && <Graph3D />}
        {viewMode === 'timeline' && <TimelineView />}
        {viewMode === 'dashboard' && <DashboardGrid />}
        {viewMode === 'abacus' && (
          <div className="w-full h-full overflow-auto">
            <AbacusDashboard />
          </div>
        )}
        {viewMode === 'agents' && (
          <div className="w-full h-full overflow-auto">
            <AgentManagement />
          </div>
        )}
        {viewMode === 'cursor' && (
          <div className="w-full h-full overflow-auto">
            <CursorStatus />
          </div>
        )}
        {viewMode === 'library' && (
          <div className="w-full h-full overflow-auto">
            <WorkflowLibrary
              onRun={(id) => setOrchestratorLiveWorkflowId(id)}
              onViewLive={(id) => setOrchestratorLiveWorkflowId(id)}
            />
          </div>
        )}

        {/* Workflow Orchestrator Live (fullscreen) */}
        {orchestratorLiveWorkflowId && (
          <WorkflowOrchestratorLive
            workflowId={orchestratorLiveWorkflowId}
            onClose={() => setOrchestratorLiveWorkflowId(null)}
          />
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
        {showConfigLeafViewer && <ConfigLeafViewer onClose={() => setShowConfigLeafViewer(false)} />}

        {/* Workflow quick-access: show workflows from config */}
        {config.workflows.length > 0 && !expandedWorkflowId && !showGuardianDashboard && !orchestratorLiveWorkflowId && (
          <div className="absolute top-2 left-2 z-10">
            <div className="bg-[var(--color-bg-panel)] border border-[var(--color-border)] rounded-lg p-2 space-y-1">
              <span className="font-mono text-[9px] text-[var(--color-text-muted)] uppercase tracking-wider">
                Workflows
              </span>
              {config.workflows.map((wf) => (
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

      {/* Bottom nav */}
      <footer className="flex items-center justify-between px-4 py-2 bg-[var(--color-bg-surface)] border-t border-[var(--color-border)] z-30 shrink-0">
        <ViewSwitcher />

        <div className="flex items-center gap-3">
          {inlineExpandedNodeIds.size > 0 && (
            <button
              onClick={collapseAllInline}
              className="font-mono text-[9px] px-2 py-1 rounded transition-colors text-[var(--color-amber)] bg-[var(--color-bg-card)] hover:bg-[var(--color-amber)]/20 border border-[var(--color-amber)]/30"
              title={`Collapse ${inlineExpandedNodeIds.size} expanded node${inlineExpandedNodeIds.size > 1 ? 's' : ''}`}
            >
              Collapse All ({inlineExpandedNodeIds.size})
            </button>
          )}
          {config.compliance.compliance_score !== undefined && (
            <div className="flex items-center gap-1.5">
              <span className="font-mono text-[9px] text-[var(--color-text-muted)]">Compliance</span>
              <div className="w-16 h-1.5 bg-[var(--color-bg-card)] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${(config.compliance.compliance_score ?? 0) * 100}%`,
                    backgroundColor:
                      (config.compliance.compliance_score ?? 0) > 0.8
                        ? 'var(--color-success)'
                        : (config.compliance.compliance_score ?? 0) > 0.5
                          ? 'var(--color-amber)'
                          : 'var(--color-error)',
                  }}
                />
              </div>
              <span className="font-mono text-[10px] text-[var(--color-text-secondary)]">
                {Math.round((config.compliance.compliance_score ?? 0) * 100)}%
              </span>
            </div>
          )}

          <button
            onClick={toggleGuardianDashboard}
            className={`font-mono text-[9px] px-2 py-1 rounded transition-colors ${
              showGuardianDashboard
                ? 'text-[var(--color-success)] bg-[var(--color-bg-card)]'
                : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]'
            }`}
          >
            Gates
          </button>

          <button
            onClick={toggleTelemetryPanel}
            className={`font-mono text-[9px] px-2 py-1 rounded transition-colors flex items-center gap-1 ${
              showTelemetryPanel
                ? 'text-[var(--color-cyan)] bg-[var(--color-bg-card)]'
                : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]'
            }`}
          >
            <div className={`w-1.5 h-1.5 rounded-full ${isXConnected ? 'bg-[var(--color-success)] animate-pulse' : 'bg-[var(--color-text-muted)]'}`} />
            X-Log
            <span className="text-[8px] text-[var(--color-text-muted)]">{xEventCount}</span>
          </button>

          <button
            onClick={toggleXFilesPanel}
            className={`font-mono text-[9px] px-2 py-1 rounded transition-colors ${
              showXFilesPanel
                ? 'text-[var(--color-error)] bg-[var(--color-bg-card)]'
                : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]'
            }`}
          >
            X-Files
            {xFilesCases.filter((c) => c.status !== 'closed').length > 0 && (
              <span className="ml-1 text-[8px] text-[var(--color-error)]">
                {xFilesCases.filter((c) => c.status !== 'closed').length}
              </span>
            )}
          </button>

          <button
            onClick={toggleGovernanceOverlay}
            className={`font-mono text-[9px] px-2 py-1 rounded transition-colors ${
              showGovernanceOverlay
                ? 'text-[var(--color-magenta)] bg-[var(--color-bg-card)]'
                : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]'
            }`}
          >
            Gov
          </button>

          <button
            onClick={toggleMapKey}
            className={`font-mono text-[9px] px-2 py-1 rounded transition-colors ${
              showMapKey
                ? 'text-[var(--color-cyan)] bg-[var(--color-bg-card)]'
                : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]'
            }`}
          >
            Legend
          </button>
        </div>
      </footer>
    </div>
    </NodeExpansionProvider>
  )
}

function StatsBar({ config }: { config: { nodes: unknown[]; edges: unknown[]; guardian: unknown[] } }) {
  return (
    <div className="flex items-center gap-3 font-mono text-[10px] text-[var(--color-text-muted)]">
      <span>
        <span className="text-[var(--color-text-secondary)]">{config.nodes.length}</span> nodes
      </span>
      <span>
        <span className="text-[var(--color-text-secondary)]">{config.edges.length}</span> edges
      </span>
      <span>
        <span className="text-[var(--color-text-secondary)]">{config.guardian.length}</span> gates
      </span>
    </div>
  )
}
