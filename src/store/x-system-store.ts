/**
 * pow3r.control - X-System Zustand Store
 *
 * Purpose:
 * - Manages real-time X-System telemetry state
 * - Circular event buffer (max 200 events)
 * - X-Files cases tracking
 * - Connection status
 * - Simulated event generator for development
 *
 * Agent Instructions:
 * - Use `useXSystemStore` hook in components
 * - Call `startSimulation()` to begin generating simulated events
 * - Call `stopSimulation()` to halt
 * - In production, replace simulation with SSE from config.superbots.link
 */
import { create } from 'zustand'
import type { XLogEntry, XFilesCase, XStreamEvent, XEventSeverity, XEventSource } from '../lib/x-system-types'

const MAX_EVENTS = 200
const MAX_LOG_ENTRIES = 100

interface XSystemState {
  isConnected: boolean
  events: XStreamEvent[]
  logEntries: XLogEntry[]
  xfilesCases: XFilesCase[]
  eventCount: number
  lastEventTime: string | null

  showTelemetryPanel: boolean
  showXFilesPanel: boolean
  telemetryFilter: XEventSeverity | 'all'

  addEvent: (event: XStreamEvent) => void
  addLogEntry: (entry: XLogEntry) => void
  addXFilesCase: (xcase: XFilesCase) => void
  setConnected: (connected: boolean) => void
  toggleTelemetryPanel: () => void
  toggleXFilesPanel: () => void
  setTelemetryFilter: (filter: XEventSeverity | 'all') => void
  clearEvents: () => void

  _simInterval: ReturnType<typeof setInterval> | null
  startSimulation: () => void
  stopSimulation: () => void
}

export const useXSystemStore = create<XSystemState>((set, get) => ({
  isConnected: false,
  events: [],
  logEntries: [],
  xfilesCases: [],
  eventCount: 0,
  lastEventTime: null,

  showTelemetryPanel: false,
  showXFilesPanel: false,
  telemetryFilter: 'all',

  addEvent: (event) =>
    set((state) => ({
      events: [...state.events.slice(-(MAX_EVENTS - 1)), event],
      eventCount: state.eventCount + 1,
      lastEventTime: event.timestamp,
    })),

  addLogEntry: (entry) =>
    set((state) => ({
      logEntries: [...state.logEntries.slice(-(MAX_LOG_ENTRIES - 1)), entry],
    })),

  addXFilesCase: (xcase) =>
    set((state) => ({
      xfilesCases: [...state.xfilesCases, xcase],
    })),

  setConnected: (isConnected) => set({ isConnected }),

  toggleTelemetryPanel: () =>
    set((state) => ({ showTelemetryPanel: !state.showTelemetryPanel })),

  toggleXFilesPanel: () =>
    set((state) => ({ showXFilesPanel: !state.showXFilesPanel })),

  setTelemetryFilter: (telemetryFilter) => set({ telemetryFilter }),

  clearEvents: () => set({ events: [], logEntries: [], eventCount: 0 }),

  _simInterval: null,

  startSimulation: () => {
    const state = get()
    if (state._simInterval) return

    set({ isConnected: true })

    generateInitialXFiles(get().addXFilesCase)

    const interval = setInterval(() => {
      const event = generateRandomEvent()
      get().addEvent(event)

      if (event.type === 'xlog') {
        get().addLogEntry(eventToLogEntry(event))
      }
    }, 800 + Math.random() * 1200)

    set({ _simInterval: interval })
  },

  stopSimulation: () => {
    const state = get()
    if (state._simInterval) {
      clearInterval(state._simInterval)
      set({ _simInterval: null, isConnected: false })
    }
  },
}))

// --- Simulated Event Generation ---

const NODE_IDS = [
  'pow3r-config', 'pkg-knowledge', 'xmap-server', 'guardian-system',
  'x-system', 'pow3r-pass', 'director-agent', 'plan-memory',
  'pow3r-control', 'component-factory', 'pow3r-writer', 'workflow-executor',
]

const EDGE_IDS = [
  'config-to-pkg', 'config-to-xmap', 'config-to-guardian',
  'config-to-xsystem', 'director-to-config', 'guardian-to-executor',
  'xsystem-to-control', 'executor-to-writer',
]

const SOURCES: XEventSource[] = ['cursor', 'workflow', 'mcp', 'guardian', 'api']

const MESSAGES = [
  'Config sync completed',
  'PKG query executed (12ms)',
  'Guardian gate check passed',
  'X-Log entry persisted',
  'Workflow step completed',
  'MCP tool invoked: pkg_hybrid',
  'Plan memory updated',
  'Health check: all systems nominal',
  'Edge function executed (23ms)',
  'Deployment validation passed',
  'Component factory: config loaded',
  'Pass credential validated',
  'XMAP schema validated',
  'Canvas sync triggered',
  'Telemetry batch flushed (42 events)',
  'Rate limit check passed',
  'TLS certificate verified',
  'API request processed (15ms)',
]

let eventCounter = 0

function generateRandomEvent(): XStreamEvent {
  eventCounter++
  const severity: XEventSeverity = Math.random() < 0.02 ? 'high'
    : Math.random() < 0.05 ? 'medium'
    : Math.random() < 0.2 ? 'low'
    : 'info'

  return {
    id: `ev-${eventCounter}`,
    type: Math.random() < 0.6 ? 'xlog' : Math.random() < 0.8 ? 'xplugin' : 'xstream',
    source: SOURCES[Math.floor(Math.random() * SOURCES.length)],
    severity,
    timestamp: new Date().toISOString(),
    nodeId: NODE_IDS[Math.floor(Math.random() * NODE_IDS.length)],
    edgeId: Math.random() < 0.3 ? EDGE_IDS[Math.floor(Math.random() * EDGE_IDS.length)] : undefined,
    message: MESSAGES[Math.floor(Math.random() * MESSAGES.length)],
  }
}

function eventToLogEntry(event: XStreamEvent): XLogEntry {
  const levelMap: Record<XEventSeverity, XLogEntry['level']> = {
    critical: 'critical',
    high: 'error',
    medium: 'warn',
    low: 'info',
    info: 'info',
  }
  return {
    id: `log-${event.id}`,
    timestamp: event.timestamp,
    level: levelMap[event.severity],
    message: event.message,
    source: event.source,
    nodeId: event.nodeId,
    correlationId: `cor-${Math.floor(Math.random() * 1000)}`,
  }
}

function generateInitialXFiles(addCase: (c: XFilesCase) => void) {
  addCase({
    id: 'xf-001',
    title: 'Writer Edge Function Timeout',
    description: 'Media generation endpoint times out after 5 minutes.',
    nodeId: 'pow3r-writer',
    status: 'open',
    severity: 'high',
    timestamp: new Date(Date.now() - 3600000).toISOString(),
  })
  addCase({
    id: 'xf-002',
    title: 'CORS Headers Missing',
    description: 'X-Files submit fails with CORS error on x-patterns-checked header.',
    nodeId: 'pow3r-writer',
    status: 'investigating',
    severity: 'medium',
    timestamp: new Date(Date.now() - 7200000).toISOString(),
  })
}
