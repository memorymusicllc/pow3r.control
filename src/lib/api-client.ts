/**
 * pow3r.control - Centralized API Client
 *
 * Purpose:
 * - Single fetch wrapper for all config.superbots.link API calls
 * - SSE subscription helpers for real-time data
 * - Error handling, retry logic, type-safe responses
 *
 * Agent Instructions:
 * - Import { api, subscribeSSE } from './api-client'
 * - api.get<T>('/api/endpoint') for GET requests
 * - api.post<T>('/api/endpoint', body) for POST requests
 * - subscribeSSE('/api/workflow/stream/:id', { onEvent, onDone }) for SSE
 */

const API_BASE = 'https://config.superbots.link'

export interface ApiResponse<T = unknown> {
  success: boolean
  message?: string
  data?: T
  error?: string
  code?: string
  meta?: Record<string, unknown>
}

interface FetchOptions {
  retry?: number
  timeout?: number
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  options: FetchOptions = {}
): Promise<ApiResponse<T>> {
  const { retry = 1, timeout = 15000 } = options
  const url = path.startsWith('http') ? path : `${API_BASE}${path}`

  for (let attempt = 0; attempt < retry; attempt++) {
    try {
      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), timeout)

      const res = await fetch(url, {
        method,
        headers: body ? { 'Content-Type': 'application/json' } : undefined,
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      })
      clearTimeout(timer)

      const json = (await res.json()) as ApiResponse<T>
      return json
    } catch (err) {
      if (attempt === retry - 1) {
        return {
          success: false,
          error: err instanceof Error ? err.message : 'Network error',
          code: 'NETWORK_ERROR',
        }
      }
      await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)))
    }
  }
  return { success: false, error: 'Request failed', code: 'REQUEST_FAILED' }
}

export const api = {
  get: <T = unknown>(path: string, options?: FetchOptions) =>
    request<T>('GET', path, undefined, options),
  post: <T = unknown>(path: string, body?: unknown, options?: FetchOptions) =>
    request<T>('POST', path, body, options),
  patch: <T = unknown>(path: string, body?: unknown, options?: FetchOptions) =>
    request<T>('PATCH', path, body, options),
}

interface SSECallbacks<T = unknown> {
  onEvent: (event: string, data: T) => void
  onDone?: () => void
  onError?: (err: string) => void
}

/**
 * Subscribe to an SSE endpoint. Returns a cleanup function.
 */
export function subscribeSSE<T = unknown>(
  path: string,
  callbacks: SSECallbacks<T>
): () => void {
  const url = path.startsWith('http') ? path : `${API_BASE}${path}`
  let stopped = false

  const es = new EventSource(url)

  es.addEventListener('status', (e) => {
    try {
      callbacks.onEvent('status', JSON.parse((e as MessageEvent).data) as T)
    } catch { /* skip */ }
  })

  es.addEventListener('done', (e) => {
    try {
      callbacks.onEvent('done', JSON.parse((e as MessageEvent).data) as T)
    } catch { /* skip */ }
    callbacks.onDone?.()
    es.close()
  })

  es.addEventListener('error', (e) => {
    if ('data' in e) {
      try {
        const d = JSON.parse((e as MessageEvent).data)
        callbacks.onError?.(d.message || 'SSE error')
      } catch { /* skip */ }
    }
  })

  es.onerror = () => {
    if (!stopped) {
      callbacks.onError?.('SSE connection lost')
      es.close()
    }
  }

  return () => {
    stopped = true
    es.close()
  }
}

export default api
