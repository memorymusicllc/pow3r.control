/**
 * pow3r.control - Chat View (PIMP Chat Page)
 *
 * Purpose:
 * - Browse chat sessions from Cursor, Abacus, Telegram, Grok, Gemini
 * - Filters: platform, role, date range, tags (with dropdown)
 * - Full-text search with auto-complete dropdown
 * - Expand all / Collapse all
 * - Message: date | platform | title; ID at bottom; full content (no truncation)
 * - Markdown rendering for message content
 * - Platform ingest (Abacus, etc.)
 */
import { useState, useEffect, useCallback, useRef } from 'react'
import ReactMarkdown from 'react-markdown'
import rehypeSanitize from 'rehype-sanitize'
import {
  fetchChatSessions,
  fetchChatMessages,
  fetchChatStats,
  fetchSessionsSearch,
  fetchTelegramSessions,
  fetchTelegramMessages,
  fetchChatTags,
  triggerIngest,
  triggerPlatformIngest,
  type ChatSession,
  type ChatMessage,
} from '../../lib/chat-api'

const PLATFORMS = ['', 'cursor', 'abacus', 'telegram', 'grok', 'gemini'] as const
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

function formatDate(ts: string): string {
  if (!ts) return ''
  try {
    const d = new Date(ts)
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
  } catch {
    return ts
  }
}

/** Build tree from flat messages; render with indent for replies, collapse/expand for threads */
function MessageTree({ messages, formatDate }: { messages: ChatMessage[]; formatDate: (ts: string) => string }) {
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())
  const byId = new Map<string, ChatMessage>()
  for (const m of messages) byId.set(m.message_id, m)
  const roots = messages.filter((m) => !m.parent_message_id || !byId.has(m.parent_message_id))
  const childrenByParent = new Map<string, ChatMessage[]>()
  for (const m of messages) {
    if (m.parent_message_id && byId.has(m.parent_message_id)) {
      const arr = childrenByParent.get(m.parent_message_id) || []
      arr.push(m)
      childrenByParent.set(m.parent_message_id, arr)
    }
  }
  const sortByTs = (a: ChatMessage, b: ChatMessage) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  roots.sort(sortByTs)
  for (const arr of childrenByParent.values()) arr.sort(sortByTs)

  const toggle = (id: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const renderMsg = (m: ChatMessage, depth: number) => {
    const kids = childrenByParent.get(m.message_id) || []
    const hasReplies = kids.length > 0
    const isCollapsed = collapsed.has(m.message_id)
    return (
      <div key={m.message_id} className={depth > 0 ? 'ml-4 border-l-2 border-[var(--color-border)] pl-2' : ''}>
        <div
          className={`rounded-lg p-3 ${
            m.role === 'user'
              ? 'bg-[var(--color-cyan)]/10 text-[var(--color-text-primary)]'
              : 'bg-[var(--color-bg-deep)] text-[var(--color-text-secondary)]'
          }`}
        >
          <div className="flex items-center gap-2 text-[10px] font-mono text-[var(--color-text-muted)] mb-1">
            {hasReplies && (
              <button
                type="button"
                onClick={() => toggle(m.message_id)}
                className="shrink-0 w-4 h-4 flex items-center justify-center rounded hover:bg-[var(--color-bg-panel)]"
                aria-label={isCollapsed ? 'Expand thread' : 'Collapse thread'}
              >
                {isCollapsed ? '+' : '-'}
              </button>
            )}
            <span>{formatDate(m.timestamp)} · {m.role}</span>
            {hasReplies && <span className="text-[var(--color-cyan)]">({kids.length} replies)</span>}
          </div>
          <div className="text-sm break-words [&_p]:my-1 [&_ul]:my-1 [&_ol]:my-1 [&_li]:my-0 [&_code]:bg-black/20 dark:[&_code]:bg-white/20 [&_code]:px-1 [&_code]:rounded [&_pre]:overflow-x-auto [&_pre]:p-2 [&_pre]:rounded [&_a]:text-[var(--color-cyan)] [&_a]:underline">
            <ReactMarkdown rehypePlugins={[rehypeSanitize]}>{m.content || ''}</ReactMarkdown>
          </div>
        </div>
        {hasReplies && !isCollapsed && (
          <div className="mt-2 space-y-2">
            {kids.map((c) => renderMsg(c, depth + 1))}
          </div>
        )}
      </div>
    )
  }

  return <div className="space-y-3">{roots.map((r) => renderMsg(r, 0))}</div>
}

export function ChatView() {
  const [platform, setPlatform] = useState<string>('')
  const [role, setRole] = useState<string>('')
  const [datePreset, setDatePreset] = useState<string>('')
  const [tags, setTags] = useState<string>('')
  const [search, setSearch] = useState('')
  const [searchDebounced, setSearchDebounced] = useState('')
  const [searchDropdownOpen, setSearchDropdownOpen] = useState(false)
  const [tagDropdownOpen, setTagDropdownOpen] = useState(false)
  const [availableTags, setAvailableTags] = useState<string[]>([])
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [total, setTotal] = useState(0)
  const [stats, setStats] = useState<{ totalMessages?: number; totalSessions?: number }>({})
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())
  const [messagesBySession, setMessagesBySession] = useState<Record<string, ChatMessage[]>>({})
  const [loading, setLoading] = useState(false)
  const [ingestLoading, setIngestLoading] = useState(false)
  const [platformIngestLoading, setPlatformIngestLoading] = useState<string | null>(null)
  const [ingestError, setIngestError] = useState<string | null>(null)
  const [abacusDeploymentId, setAbacusDeploymentId] = useState('')
  const searchRef = useRef<HTMLInputElement>(null)
  const tagRef = useRef<HTMLInputElement>(null)

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

  const loadTags = useCallback(async () => {
    try {
      const data = await fetchChatTags()
      setAvailableTags(data.tags || [])
    } catch {
      setAvailableTags([])
    }
  }, [])

  useEffect(() => {
    loadSessions()
    if (platform !== 'telegram') loadStats()
  }, [loadSessions, loadStats, platform])

  const loadMessages = useCallback(async (s: ChatSession) => {
    const id = `${s.platform}:${s.sessionId}`
    if (messagesBySession[id] !== undefined) {
      setExpandedIds((prev) => {
        const next = new Set(prev)
        if (next.has(id)) next.delete(id)
        else next.add(id)
        return next
      })
      return
    }
    try {
      let msgs: ChatMessage[]
      if (s.platform === 'telegram') {
        const data = await fetchTelegramMessages(s.sessionId)
        msgs = data.messages
      } else {
        const { since, until } = toISODate(datePreset)
        const data = await fetchChatMessages({
          platform: s.platform,
          sessionId: s.sessionId,
          role: role || undefined,
          since,
          until,
          limit: 200,
        })
        msgs = data.messages
      }
      setMessagesBySession((prev) => ({ ...prev, [id]: msgs }))
      setExpandedIds((prev) => new Set(prev).add(id))
    } catch {
      setMessagesBySession((prev) => ({ ...prev, [id]: [] }))
      setExpandedIds((prev) => new Set(prev).add(id))
    }
  }, [role, datePreset, messagesBySession])

  const expandAll = async () => {
    const toLoad = sessions.filter((s) => {
      const id = `${s.platform}:${s.sessionId}`
      return !messagesBySession[id]
    })
    for (const s of toLoad) {
      await loadMessages(s)
    }
    if (toLoad.length === 0) {
      setExpandedIds(new Set(sessions.map((s) => `${s.platform}:${s.sessionId}`)))
    }
  }

  const collapseAll = () => {
    setExpandedIds(new Set())
  }

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

  const handlePlatformIngest = async (plat: 'abacus' | 'gemini' | 'grok') => {
    setPlatformIngestLoading(plat)
    setIngestError(null)
    try {
      const opts = plat === 'abacus' && abacusDeploymentId.trim()
        ? { deploymentId: abacusDeploymentId.trim() }
        : undefined
      await triggerPlatformIngest(plat, opts)
      await loadSessions()
      if (platform !== 'telegram') await loadStats()
    } catch (e) {
      setIngestError(e instanceof Error ? e.message : `${plat} ingest failed`)
    } finally {
      setPlatformIngestLoading(null)
    }
  }

  const searchSuggestions = searchDebounced ? sessions.slice(0, 10).map((s) => s.sessionId || s.title || `${s.platform}:${s.sessionId}`) : []

  return (
    <div className="flex flex-col h-full gap-3 p-3 overflow-hidden">
      <div className="flex flex-wrap gap-2 items-center shrink-0">
        <div className="relative flex-1 min-w-[120px]">
          <input
            ref={searchRef}
            type="text"
            placeholder="Search sessions / Chat Title..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setSearchDropdownOpen(true)
            }}
            onFocus={() => setSearchDropdownOpen(true)}
            onBlur={() => setTimeout(() => setSearchDropdownOpen(false), 150)}
            className="w-full px-2 py-1.5 rounded border border-[var(--color-border)] bg-[var(--color-bg-card)] text-[var(--color-text-primary)] text-sm"
          />
          {searchDropdownOpen && searchDebounced && searchSuggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 z-10 rounded border border-[var(--color-border)] bg-[var(--color-bg-panel)] shadow-lg max-h-40 overflow-y-auto">
              {searchSuggestions.map((title) => (
                <button
                  key={title}
                  type="button"
                  className="w-full text-left px-2 py-1.5 text-xs hover:bg-[var(--color-bg-deep)]"
                  onClick={() => {
                    setSearch(title)
                    setSearchDropdownOpen(false)
                  }}
                >
                  {title}
                </button>
              ))}
            </div>
          )}
        </div>
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
        <div className="relative">
          <input
            ref={tagRef}
            type="text"
            placeholder="Tags (comma)"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            onFocus={() => {
              setTagDropdownOpen(true)
              loadTags()
            }}
            onBlur={() => setTimeout(() => setTagDropdownOpen(false), 150)}
            className="w-28 px-2 py-1.5 rounded border border-[var(--color-border)] bg-[var(--color-bg-card)] text-[var(--color-text-primary)] text-sm"
          />
          {tagDropdownOpen && availableTags.length > 0 && (
            <div className="absolute top-full left-0 mt-1 z-10 w-40 rounded border border-[var(--color-border)] bg-[var(--color-bg-panel)] shadow-lg max-h-32 overflow-y-auto">
              {availableTags.map((t) => (
                <button
                  key={t}
                  type="button"
                  className="w-full text-left px-2 py-1 text-xs hover:bg-[var(--color-bg-deep)]"
                  onClick={() => {
                    setTags((prev) => (prev ? `${prev}, ${t}` : t))
                    setTagDropdownOpen(false)
                  }}
                >
                  {t}
                </button>
              ))}
            </div>
          )}
        </div>
        <button
          onClick={handleIngest}
          disabled={ingestLoading}
          className="px-3 py-1.5 rounded bg-[var(--color-cyan)]/20 text-[var(--color-cyan)] text-sm font-medium hover:bg-[var(--color-cyan)]/30 disabled:opacity-50"
        >
          {ingestLoading ? 'Running...' : 'Ingest / Update'}
        </button>
        <input
          type="text"
          placeholder="Abacus deployment ID (optional)"
          value={abacusDeploymentId}
          onChange={(e) => setAbacusDeploymentId(e.target.value)}
          className="w-36 px-2 py-1.5 rounded border border-[var(--color-border)] bg-[var(--color-bg-card)] text-[var(--color-text-primary)] text-xs"
        />
        <button
          onClick={() => handlePlatformIngest('abacus')}
          disabled={platformIngestLoading !== null}
          className="px-2 py-1.5 rounded border border-[var(--color-border)] text-xs hover:bg-[var(--color-bg-deep)] disabled:opacity-50"
        >
          {platformIngestLoading === 'abacus' ? '...' : 'Ingest Abacus'}
        </button>
        <button
          onClick={expandAll}
          className="px-2 py-1.5 rounded border border-[var(--color-border)] text-xs hover:bg-[var(--color-bg-deep)]"
        >
          Expand all
        </button>
        <button
          onClick={collapseAll}
          className="px-2 py-1.5 rounded border border-[var(--color-border)] text-xs hover:bg-[var(--color-bg-deep)]"
        >
          Collapse all
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
            const isExpanded = expandedIds.has(id)
            const msgs = messagesBySession[id] || []
            const title = s.title || s.sessionId
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
                    {title}
                  </span>
                  <span className="text-xs text-[var(--color-text-muted)] shrink-0 ml-2">
                    {s.last_message_at ? formatDate(s.last_message_at) : ''} · {s.messageCount ?? msgs.length ?? 0} msgs
                  </span>
                </button>
                {isExpanded && (
                  <div className="border-t border-[var(--color-border)] p-3 max-h-96 overflow-y-auto space-y-3">
                    {msgs.length === 0 ? (
                      <div className="text-[var(--color-text-muted)] text-xs">No messages</div>
                    ) : (
                      <MessageTree messages={msgs} formatDate={formatDate} />
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
