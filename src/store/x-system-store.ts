/**
 * pow3r.control - X-System Zustand Store
 *
 * Purpose:
 * - Manages real-time X-System telemetry state from SSE
 * - Circular event buffer (max 200 events)
 * - X-Files cases from /api/x-files/latest (real data)
 * - Connection status via SSE
 *
 * Agent Instructions:
 * - Use `useXSystemStore` hook in components
 * - SSE connection is managed by App.tsx via connectXSystemSSE
 * - Call fetchXFilesCases() on mount to load real X-Files
 */
import { create } from 'zustand'
import { api } from '../lib/api-client'
import type { XLogEntry, XFilesCase, XStreamEvent, XEventSeverity } from '../lib/x-system-types'

const MAX_EVENTS = 200
const MAX_LOG_ENTRIES = 100

interface XSystemState {
  isConnected: boolean
  events: XStreamEvent[]
  logEntries: XLogEntry[]
  xfilesCases: XFilesCase[]
  xfilesLoading: boolean
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
  fetchXFilesCases: () => Promise<void>
}

export const useXSystemStore = create<XSystemState>((set, get) => ({
  isConnected: false,
  events: [],
  logEntries: [],
  xfilesCases: [],
  xfilesLoading: false,
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

  fetchXFilesCases: async () => {
    if (get().xfilesLoading) return
    set({ xfilesLoading: true })
    const res = await api.get<XFilesCase[]>('/api/x-files/latest?limit=50')
    if (res.success && res.data) {
      const cases = Array.isArray(res.data) ? res.data : []
      set({ xfilesCases: cases, xfilesLoading: false })
    } else {
      set({ xfilesLoading: false })
    }
  },
}))

/**
 * Convert SSE event to XLogEntry for the log panel
 */
export function eventToLogEntry(event: XStreamEvent): XLogEntry {
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
    correlationId: undefined,
  }
}
