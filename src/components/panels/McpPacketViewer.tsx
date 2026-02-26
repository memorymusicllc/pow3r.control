/**
 * pow3r.control - MCP Packet Viewer
 *
 * Purpose:
 * - Request/response JSON trees with syntax-style formatting
 * - Timing, success/fail coloring, correlation linking
 * - Collapsible panels for request and response
 */
import { useState } from 'react'

export interface McpPacketRequest {
  name: string
  server?: string
  arguments?: Record<string, unknown>
  raw?: Record<string, unknown>
}

export interface McpPacketResponse {
  success?: boolean
  data?: unknown
  error?: string
  code?: string | number
  aiGuidance?: { issue?: string; solution?: string; steps?: string[] }
  raw?: Record<string, unknown>
}

export interface McpPacketProps {
  request: McpPacketRequest
  response?: McpPacketResponse | null
  durationMs?: number
  correlationId?: string
  stepId?: string
}

export function McpPacketViewer({
  request,
  response,
  durationMs,
  correlationId,
  stepId,
}: McpPacketProps) {
  const [requestOpen, setRequestOpen] = useState(true)
  const [responseOpen, setResponseOpen] = useState(true)

  const isSuccess = response ? (response.success !== false && !response.error) : null

  return (
    <div className="font-mono text-[10px] space-y-2">
      {stepId && (
        <div className="text-[var(--color-text-muted)]">
          Step: <span className="text-[var(--color-cyan)]">{stepId}</span>
        </div>
      )}

      {correlationId && (
        <div className="flex items-center gap-1.5">
          <span className="text-[var(--color-text-muted)]">Correlation:</span>
          <code className="text-[var(--color-purple)] truncate max-w-[180px]" title={correlationId}>
            {correlationId}
          </code>
        </div>
      )}

      {durationMs !== undefined && (
        <div className="flex items-center gap-1.5">
          <span className="text-[var(--color-text-muted)]">Duration:</span>
          <span className={durationMs > 2000 ? 'text-[var(--color-amber)]' : 'text-[var(--color-cyan)]'}>
            {durationMs}ms
          </span>
        </div>
      )}

      {/* Request panel */}
      <div
        className={`border rounded overflow-hidden ${
          requestOpen ? 'border-[var(--color-cyan)]' : 'border-[var(--color-border)]'
        }`}
      >
        <button
          onClick={() => setRequestOpen(!requestOpen)}
          className="w-full flex items-center justify-between px-2 py-1.5 bg-[var(--color-bg-card)] hover:bg-[var(--color-bg-surface)] text-left"
        >
          <span className="text-[var(--color-cyan)]">Request</span>
          <span className="text-[var(--color-text-muted)]">{requestOpen ? '-' : '+'}</span>
        </button>
        {requestOpen && (
          <div className="p-2 bg-[var(--color-bg-deep)] overflow-x-auto">
            <JsonTree data={request} />
          </div>
        )}
      </div>

      {/* Response panel */}
      {response && (
        <div
          className={`border rounded overflow-hidden ${
            isSuccess === true
              ? 'border-[var(--color-success)]'
              : isSuccess === false
                ? 'border-[var(--color-error)]'
                : 'border-[var(--color-border)]'
          }`}
        >
          <button
            onClick={() => setResponseOpen(!responseOpen)}
            className="w-full flex items-center justify-between px-2 py-1.5 bg-[var(--color-bg-card)] hover:bg-[var(--color-bg-surface)] text-left"
          >
            <span
              className={
                isSuccess === true
                  ? 'text-[var(--color-success)]'
                  : isSuccess === false
                    ? 'text-[var(--color-error)]'
                    : 'text-[var(--color-text-secondary)]'
              }
            >
              Response {isSuccess === true ? '(success)' : isSuccess === false ? '(failed)' : ''}
            </span>
            <span className="text-[var(--color-text-muted)]">{responseOpen ? '-' : '+'}</span>
          </button>
          {responseOpen && (
            <div className="p-2 bg-[var(--color-bg-deep)] overflow-x-auto">
              {response.error && (
                <div className="mb-2 p-2 rounded bg-[var(--color-error)]20 border border-[var(--color-error)]">
                  <div className="text-[var(--color-error)] font-semibold">{response.error}</div>
                  {response.code && (
                    <div className="text-[var(--color-text-muted)]">Code: {response.code}</div>
                  )}
                </div>
              )}
              {response.aiGuidance && (
                <div className="mb-2 p-2 rounded bg-[var(--color-amber)]15 border border-[var(--color-amber)]">
                  {response.aiGuidance.issue && (
                    <div className="text-[var(--color-amber)]">Issue: {response.aiGuidance.issue}</div>
                  )}
                  {response.aiGuidance.solution && (
                    <div className="text-[var(--color-text-secondary)] mt-1">
                      Fix: {response.aiGuidance.solution}
                    </div>
                  )}
                </div>
              )}
              <JsonTree data={response} />
            </div>
          )}
        </div>
      )}
    </div>
  )
}

/** Recursive JSON tree renderer with collapsible objects/arrays */
function JsonTree({
  data,
  depth = 0,
  keyName,
}: {
  data: unknown
  depth?: number
  keyName?: string
}) {
  const [open, setOpen] = useState(depth < 2)

  if (data === null) return <span className="text-[var(--color-text-muted)]">null</span>
  if (data === undefined) return <span className="text-[var(--color-text-muted)]">undefined</span>

  if (typeof data === 'boolean') {
    return (
      <span className={data ? 'text-[var(--color-success)]' : 'text-[var(--color-amber)]'}>
        {String(data)}
      </span>
    )
  }
  if (typeof data === 'number') {
    return <span className="text-[var(--color-cyan)]">{data}</span>
  }
  if (typeof data === 'string') {
    return <span className="text-[var(--color-magenta)]">&quot;{data}&quot;</span>
  }

  if (Array.isArray(data)) {
    if (data.length === 0) return <span className="text-[var(--color-text-muted)]">[]</span>
    return (
      <div className="pl-2 border-l border-[var(--color-border)]">
        <button
          onClick={() => setOpen(!open)}
          className="text-left hover:text-[var(--color-cyan)]"
        >
          <span className="text-[var(--color-text-muted)]">[{open ? '-' : '+'}]</span>
          {keyName && <span className="ml-1 text-[var(--color-text-secondary)]">{keyName}: </span>}
        </button>
        {open && (
          <div className="pl-2">
            {data.map((item, i) => (
              <div key={i}>
                <span className="text-[var(--color-text-muted)]">{i}: </span>
                <JsonTree data={item} depth={depth + 1} />
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  if (typeof data === 'object') {
    const entries = Object.entries(data)
    if (entries.length === 0) return <span className="text-[var(--color-text-muted)]">{'{}'}</span>
    return (
      <div className="pl-2 border-l border-[var(--color-border)]">
        <button
          onClick={() => setOpen(!open)}
          className="text-left hover:text-[var(--color-cyan)]"
        >
          <span className="text-[var(--color-text-muted)]">{'{'}{open ? '-' : '+'}{'}'}</span>
          {keyName && <span className="ml-1 text-[var(--color-text-secondary)]">{keyName}</span>}
        </button>
        {open && (
          <div className="pl-2 space-y-0.5">
            {entries.map(([k, v]) => (
              <div key={k}>
                <span className="text-[var(--color-purple)]">{k}</span>
                <span className="text-[var(--color-text-muted)]">: </span>
                <JsonTree data={v} depth={depth + 1} keyName={k} />
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  return <span>{String(data)}</span>
}
