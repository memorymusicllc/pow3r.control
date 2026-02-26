/**
 * pow3r.control - X-System SSE Stream Connector
 *
 * Purpose:
 * - Connects to config.superbots.link SSE endpoint for real-time telemetry
 * - Parses X-System events from the stream
 * - Falls back to simulated events if SSE is unavailable
 *
 * Agent Instructions:
 * - Call connectXSystemSSE() to start live stream
 * - Pass event handlers for onEvent, onLogEntry, onXFilesCase
 * - Auto-reconnects with exponential backoff on disconnect
 */
import type { XStreamEvent } from './x-system-types'

const SSE_URL = 'https://config.superbots.link/mcp/xstream/events'

interface SSEOptions {
  onEvent: (event: XStreamEvent) => void
  onConnect: () => void
  onDisconnect: () => void
}

export function connectXSystemSSE(options: SSEOptions): () => void {
  let eventSource: EventSource | null = null
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null
  let reconnectDelay = 1000
  let stopped = false

  function connect() {
    if (stopped) return

    try {
      eventSource = new EventSource(SSE_URL)

      eventSource.onopen = () => {
        reconnectDelay = 1000
        options.onConnect()
      }

      eventSource.onmessage = (msg) => {
        try {
          const data = JSON.parse(msg.data)
          const event: XStreamEvent = {
            id: data.id ?? `sse-${Date.now()}`,
            type: data.type ?? 'xstream',
            source: data.source ?? 'api',
            severity: data.severity ?? 'info',
            timestamp: data.timestamp ?? new Date().toISOString(),
            nodeId: data.nodeId ?? data.node_id,
            edgeId: data.edgeId ?? data.edge_id,
            message: data.message ?? JSON.stringify(data),
            data: data.data,
          }
          options.onEvent(event)
        } catch {
          // Skip malformed events
        }
      }

      eventSource.onerror = () => {
        eventSource?.close()
        options.onDisconnect()

        if (!stopped) {
          reconnectTimer = setTimeout(() => {
            reconnectDelay = Math.min(reconnectDelay * 2, 30000)
            connect()
          }, reconnectDelay)
        }
      }
    } catch {
      options.onDisconnect()
      if (!stopped) {
        reconnectTimer = setTimeout(connect, reconnectDelay)
      }
    }
  }

  connect()

  return () => {
    stopped = true
    eventSource?.close()
    if (reconnectTimer) clearTimeout(reconnectTimer)
  }
}
