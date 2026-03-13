/**
 * pow3r.control - XMAP WebSocket Client
 *
 * Purpose:
 * - Connects to config.superbots.link/ws for real-time XMAP updates
 * - Subscribes to all XMAP IDs (wildcard '*')
 * - Receives xmap_change events with node/edge status updates
 * - Auto-reconnects with exponential backoff
 *
 * Agent Instructions:
 * - Call connectXmapWebSocket() with callbacks for change events
 * - Returns a cleanup function to close the connection
 * - The control store wires this to update node statuses live
 */

const WS_URL = 'wss://config.superbots.link/ws'

interface XmapChangeEvent {
  type: string
  xmapId: string
  changeType: string
  data: Record<string, unknown>
  timestamp: string
}

interface XmapWSOptions {
  onChange: (event: XmapChangeEvent) => void
  onConnect: () => void
  onDisconnect: () => void
}

export function connectXmapWebSocket(options: XmapWSOptions): () => void {
  let ws: WebSocket | null = null
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null
  let reconnectDelay = 2000
  let stopped = false
  let pingTimer: ReturnType<typeof setInterval> | null = null

  function connect() {
    if (stopped) return

    try {
      ws = new WebSocket(WS_URL)

      ws.onopen = () => {
        reconnectDelay = 2000
        options.onConnect()

        ws?.send(JSON.stringify({
          type: 'subscribe',
          xmapIds: ['*'],
          changeTypes: ['*'],
        }))

        pingTimer = setInterval(() => {
          if (ws?.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'ping' }))
          }
        }, 30000)
      }

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data as string) as XmapChangeEvent
          if (msg.type === 'xmap_change') {
            options.onChange(msg)
          }
        } catch {
          // skip malformed messages
        }
      }

      ws.onclose = () => {
        cleanup()
        options.onDisconnect()
        if (!stopped) {
          reconnectTimer = setTimeout(() => {
            reconnectDelay = Math.min(reconnectDelay * 2, 60000)
            connect()
          }, reconnectDelay)
        }
      }

      ws.onerror = () => {
        ws?.close()
      }
    } catch {
      options.onDisconnect()
    }
  }

  function cleanup() {
    if (pingTimer) {
      clearInterval(pingTimer)
      pingTimer = null
    }
  }

  connect()

  return () => {
    stopped = true
    cleanup()
    ws?.close()
    if (reconnectTimer) clearTimeout(reconnectTimer)
  }
}
