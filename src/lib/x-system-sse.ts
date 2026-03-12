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
  let reconnectDelay = 2000
  let stopped = false
  let failCount = 0

  async function checkEndpoint(): Promise<boolean> {
    try {
      const res = await fetch(SSE_URL, { method: 'HEAD' })
      return res.ok
    } catch {
      return false
    }
  }

  function connect() {
    if (stopped) return

    try {
      eventSource = new EventSource(SSE_URL)

      eventSource.onopen = () => {
        reconnectDelay = 2000
        failCount = 0
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
          // skip malformed events
        }
      }

      eventSource.onerror = () => {
        eventSource?.close()
        options.onDisconnect()
        failCount++

        if (!stopped && failCount < 5) {
          reconnectTimer = setTimeout(() => {
            reconnectDelay = Math.min(reconnectDelay * 2, 60000)
            connect()
          }, reconnectDelay)
        }
      }
    } catch {
      options.onDisconnect()
    }
  }

  checkEndpoint().then((available) => {
    if (available && !stopped) {
      connect()
    } else {
      console.warn('[X-System SSE] Endpoint unavailable, skipping connection')
      options.onDisconnect()
    }
  })

  return () => {
    stopped = true
    eventSource?.close()
    if (reconnectTimer) clearTimeout(reconnectTimer)
  }
}
