/**
 * pow3r.control - Chat API Client
 *
 * Purpose:
 * - Fetch chat sessions, messages, stats from config.superbots.link
 * - Supports role, date, tags, platform filters
 * - Telegram (Jaime) sessions and messages
 * - Ingest workflow trigger
 *
 * Agent Instructions:
 * - API base: https://config.superbots.link
 * - All endpoints under /api/chat/*
 */

const API_BASE = 'https://config.superbots.link/api'

export interface ChatSession {
  platform: string
  sessionId: string
  messageCount?: number
  last_message_at?: string
  title?: string
  metadata?: { tags?: string[] }
}

export interface ChatMessage {
  id?: number
  platform: string
  session_id: string
  message_id: string
  role: string
  content: string
  timestamp: string
  agent_id?: string
  metadata?: { tags?: string[] }
}

export interface ChatStats {
  totalMessages?: number
  totalSessions?: number
  totalTasks?: number
  pendingTasks?: number
  byPlatform?: Array<{ platform: string; count: number }>
}

export interface FetchSessionsParams {
  platform?: string
  since?: string
  until?: string
  tags?: string
  limit?: number
}

export interface FetchMessagesParams {
  platform?: string
  sessionId?: string
  role?: string
  since?: string
  until?: string
  search?: string
  tags?: string
  limit?: number
  offset?: number
}

export async function fetchChatSessions(params: FetchSessionsParams = {}): Promise<{ sessions: ChatSession[]; total: number }> {
  const sp = new URLSearchParams()
  if (params.platform) sp.set('platform', params.platform)
  if (params.since) sp.set('since', params.since)
  if (params.until) sp.set('until', params.until)
  if (params.tags) sp.set('tags', params.tags)
  if (params.limit) sp.set('limit', String(params.limit))
  const res = await fetch(`${API_BASE}/chat/sessions?${sp}`)
  const json = await res.json()
  if (!json.success) throw new Error(json.error || json.data?.error || 'Failed to fetch sessions')
  return json.data || { sessions: [], total: 0 }
}

export async function fetchSessionsSearch(q: string, platform?: string, limit = 20): Promise<{ sessions: ChatSession[] }> {
  const sp = new URLSearchParams({ q, limit: String(limit) })
  if (platform) sp.set('platform', platform)
  const res = await fetch(`${API_BASE}/chat/sessions/search?${sp}`)
  const json = await res.json()
  if (!json.success) return { sessions: [] }
  return json.data || { sessions: [] }
}

export async function fetchChatMessages(params: FetchMessagesParams = {}): Promise<{ messages: ChatMessage[]; total: number }> {
  const sp = new URLSearchParams()
  if (params.platform) sp.set('platform', params.platform)
  if (params.sessionId) sp.set('sessionId', params.sessionId)
  if (params.role) sp.set('role', params.role)
  if (params.since) sp.set('since', params.since)
  if (params.until) sp.set('until', params.until)
  if (params.search) sp.set('search', params.search)
  if (params.tags) sp.set('tags', params.tags)
  if (params.limit) sp.set('limit', String(params.limit))
  if (params.offset) sp.set('offset', String(params.offset))
  const res = await fetch(`${API_BASE}/chat/messages?${sp}`)
  const json = await res.json()
  if (!json.success) throw new Error(json.error || json.data?.error || 'Failed to fetch messages')
  return json.data || { messages: [], total: 0 }
}

export async function fetchChatStats(platform?: string, since?: string): Promise<{ stats: ChatStats }> {
  const sp = new URLSearchParams()
  if (platform) sp.set('platform', platform)
  if (since) sp.set('since', since)
  const res = await fetch(`${API_BASE}/chat/stats?${sp}`)
  const json = await res.json()
  if (!json.success) throw new Error(json.error || 'Failed to fetch stats')
  return json.data || { stats: {} }
}

export async function fetchTelegramSessions(): Promise<{ sessions: ChatSession[] }> {
  const res = await fetch(`${API_BASE}/chat/telegram/sessions`)
  const json = await res.json()
  if (!json.success) return { sessions: [] }
  return json.data || { sessions: [] }
}

export async function fetchTelegramMessages(contactId: string): Promise<{ messages: ChatMessage[] }> {
  const res = await fetch(`${API_BASE}/chat/telegram/messages?contactId=${encodeURIComponent(contactId)}`)
  const json = await res.json()
  if (!json.success) return { messages: [] }
  return json.data || { messages: [] }
}

export async function triggerIngest(workflowId: string, input?: object): Promise<{ started: boolean; workflowId?: string; result?: unknown }> {
  const res = await fetch(`${API_BASE}/chat/ingest/trigger`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ workflowId, input: input || {} }),
  })
  const json = await res.json()
  if (!json.success) throw new Error(json.error || json.data?.error || 'Ingest trigger failed')
  return json.data || { started: true, workflowId }
}

export async function fetchChatTags(): Promise<{ tags: string[] }> {
  const res = await fetch(`${API_BASE}/chat/tags`)
  const json = await res.json()
  if (!json.success) return { tags: [] }
  return json.data || { tags: [] }
}

export async function triggerPlatformIngest(platform: 'abacus' | 'gemini' | 'grok', limit = 100): Promise<{ platform: string; recorded?: number; conversations?: number; errors?: string[] }> {
  const res = await fetch(`${API_BASE}/chat/ingest/platform`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ platform, limit }),
  })
  const json = await res.json()
  if (!json.success) throw new Error(json.error || json.data?.error || 'Platform ingest failed')
  return json.data || { platform }
}
