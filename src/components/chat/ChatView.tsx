/**
 * pow3r.control - Chat View (PIMP Chat Page)
 *
 * Purpose:
 * - Browse chat sessions from Cursor, Abacus, Telegram (Jaime), etc.
 * - Filters: platform, role, date range, tags
 * - Full-text search
 * - Ingest / Update button to trigger conversation workflows
 *
 * Agent Instructions:
 * - Uses chat-api.ts for all API calls
 * - Platform "telegram" uses /api/chat/telegram/* endpoints
 */
import { useState, useEffect, useCallback } from 'react'
import {
  fetchChatSessions,
  fetchChatMessages,
  fetchChatStats,
  fetchSessionsSearch,
  fetchTelegramSessions,
  fetchTelegramMessages,
  triggerIngest,
  type ChatSession,
  type ChatMessage,
} from '../../lib/chat-api'

const PLATFORMS = ['', 'cursor', 'abacus', 'telegram'] as const
const ROLES = ['', 'user', 'assistant', 'system'] as const
const DATE_PRESETS = [
  { label: 'All time', since: '', until: '' },
  { label: 'Last 7 days', since: '7d', until: '' },
  { label: 'Last 30 days', since: '30d', until: '' },
  { label: 'Last 90 days', since: '90d', until: '' },
] as const

function toISODate(preset: string): { since?: string; until?: string } {
  if (!preset) return {}
  const now = new Date()
  let since: Date
  if (preset === '7d') since = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  else if (preset === '30d') since = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  else if (preset === '90d') since = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
  else return {}
  return { since: since.toISOString(), until: now.toISOString() }
}

export function ChatView() {
  const [platform, setPlatform] = useState<string>('')
  const [role, setRole] = useState<string>('')
  const [datePreset, setDatePreset] = useState<string>('')
  const [tags, setTags] = useState<string>('')
  const [search, setSearch] = useState('')
  const [searchDebounced, setSearchDebounced] = useState('')
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [total, setTotal] = useState(0)
  const [stats, setStats] = useState<{ totalMessages?: number; totalSessions?: number }>({})
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [loading, setLoading] = useState(false)
  const [ingestLoading, setIngestLoading] = useState(false)
  const [ingestError, setIngestError] = useState<string | null>(null)

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setSearchDebounced(search), 300)
    return () => clearTimeout(t)
  }, [search])

  const loadSessions = useCallback(async () => {
    setLoading(true)
    try {
      const { since, until } = toISODate(datePreset)
      if (platform === 'telegram') {
        const data = await fetchTelegramSessions()
        setSessions(data.sessions)
        setTotal(data.sessions.length)
      } else if (searchDebounced) {
        const data = await fetchSessionsSearch(searchDebounced, platform || undefined, 50)
        setSessions(data.sessions)
        setTotal(data.sessions.length)
      } else {
        const data = await fetchChatSessions({
          platform: platform || undefined,
          since,
          until,
          tags: tags || undefined,
          limit: 50,
        })
        setSessions(data.sessions)
        setTotal(data.total)
      }
    } catch (e) {
      setSessions([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }, [platform, datePreset, tags, searchDebounced])

  const loadStats = useCallback(async () => {
    try {
      const { since } = toISODate(datePreset)
      const data = await fetchChatStats(platform || undefined, since)
      setStats(data.stats)
    } catch {
      setStats({})
    }
  }, [platform, datePreset])

  useEffect(() => {
    loadSessions()
    if (platform !== 'telegram') loadStats()
  }, [loadSessions, loadStats, platform])

  const loadMessages = useCallback(async (s: ChatSession) => {
    const id = `${s.platform}:${s.sessionId}`
    if (expandedId === id) {
      setExpandedId(null)
      setMessages([])
      return
    }
    setExpandedId(id)
    try {
      if (s.platform === 'telegram') {
        const data = await fetchTelegramMessages(s.sessionId)
        setMessages(data.messages)
      } else {
        const { since, until } = toISODate(datePreset)
        const data = await fetchChatMessages({
          platform: s.platform,
          sessionId: s.sessionId,
          role: role || undefined,
          since,
          until,
          limit: 100,
        })
        setMessages(data.messages)
      }
    } catch {
      setMessages([])
    }
  }, [expandedId, role, datePreset])

  const handleIngest = async () => {
    setIngestLoading(true)
    setIngestError(null)
    try {
      await triggerIngest('wf-conversation-review-v1')
      await loadSessions()
      if (platform !== 'telegram') await loadStats()
    } catch (e) {
      setIngestError(e instanceof Error ? e.message : 'Ingest failed')
    } finally {
      setIngestLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-full gap-3 p-3 overflow-hidden">
      <div className="flex flex-wrap gap-2 items-center shrink-0">
        <input
          type="text"
          placeholder="Search sessions..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 min-w-[120px] px-2 py-1.5 rounded border border-[var(--color-border)] bg-[var(--color-bg-card)] text-[var(--color-text-primary)] text-sm"
        />
        <select
          value={platform}
          onChange={(e) => setPlatform(e.target.value)}
          className="px-2 py-1.5 rounded border border-[var(--color-border)] bg-[var(--color-bg-card)] text-[var(--color-text-primary)] text-sm"
        >
          <option value="">All platforms</option>
          {PLATFORMS.filter(Boolean).map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="px-2 py-1.5 rounded border border-[var(--color-border)] bg-[var(--color-bg-card)] text-[var(--color-text-primary)] text-sm"
        >
          <option value="">All roles</option>
          {ROLES.filter(Boolean).map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
        <select
          value={datePreset}
          onChange={(e) => setDatePreset(e.target.value)}
          className="px-2 py-1.5 rounded border border-[var(--color-border)] bg-[var(--color-bg-card)] text-[var(--color-text-primary)] text-sm"
        >
          {DATE_PRESETS.map((d) => (
            <option key={d.label} value={d.since}>{d.label}</option>
          ))}
        </select>
        <input
          type="text"
          placeholder="Tags (comma)"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          className="w-28 px-2 py-1.5 rounded border border-[var(--color-border)] bg-[var(--color-bg-card)] text-[var(--color-text-primary)] text-sm"
        />
        <button
          onClick={handleIngest}
          disabled={ingestLoading}
          className="px-3 py-1.5 rounded bg-[var(--color-cyan)]/20 text-[var(--color-cyan)] text-sm font-medium hover:bg-[var(--color-cyan)]/30 disabled:opacity-50"
        >
          {ingestLoading ? 'Running...' : 'Ingest / Update'}
        </button>
      </div>
      {ingestError && (
        <div className="text-red-500 text-sm shrink-0">{ingestError}</div>
      )}
      {stats.totalMessages != null && platform !== 'telegram' && (
        <div className="text-[var(--color-text-muted)] text-xs shrink-0">
          {stats.totalMessages} messages, {stats.totalSessions ?? total} sessions
        </div>
      )}
      <div className="flex-1 overflow-y-auto space-y-2">
        {loading ? (
          <div className="text-[var(--color-text-muted)] text-sm">Loading...</div>
        ) : sessions.length === 0 ? (
          <div className="text-[var(--color-text-muted)] text-sm">No sessions found.</div>
        ) : (
          sessions.map((s) => {
            const id = `${s.platform}:${s.sessionId}`
            const isExpanded = expandedId === id
            return (
              <div
                key={id}
                className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-card)] overflow-hidden"
              >
                <button
                  onClick={() => loadMessages(s)}
                  className="w-full text-left px-3 py-2 flex items-center justify-between hover:bg-[var(--color-bg-deep)]"
                >
                  <span className="text-sm font-mono truncate flex-1">
                    <span className="text-[var(--color-cyan)] mr-2">{s.platform}</span>
                    {s.sessionId}
                  </span>
                  <span className="text-xs text-[var(--color-text-muted)] shrink-0 ml-2">
                    {s.messageCount ?? 0} msgs
                  </span>
                </button>
                {isExpanded && (
                  <div className="border-t border-[var(--color-border)] p-3 max-h-64 overflow-y-auto space-y-2">
                    {messages.length === 0 ? (
                      <div className="text-[var(--color-text-muted)] text-xs">No messages</div>
                    ) : (
                      messages.map((m) => (
                        <div
                          key={m.message_id}
                          className={`text-xs p-2 rounded ${
                            m.role === 'user'
                              ? 'bg-[var(--color-cyan)]/10 text-[var(--color-text-primary)]'
                              : 'bg-[var(--color-bg-deep)] text-[var(--color-text-secondary)]'
                          }`}
                        >
                          <span className="font-mono text-[var(--color-cyan)]">{m.role}:</span>{' '}
                          {(m.content || '').slice(0, 300)}
                          {(m.content || '').length > 300 ? '...' : ''}
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
