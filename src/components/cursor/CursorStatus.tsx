/**
 * pow3r.control - Cursor Components Status
 *
 * Purpose:
 * - Rule compliance grid, active sessions, MCP connection health
 * - Enforcer protocol checklist
 */
const ENFORCER_CHECKLIST = [
  { id: 'pkg', label: 'PKG query before task', status: 'pass' },
  { id: 'xplugin', label: 'X-Plugin observation logged', status: 'pass' },
  { id: 'docs', label: 'Core docs read', status: 'pass' },
]

export function CursorStatus() {
  return (
    <div className="p-4 space-y-4">
      <h4 className="font-mono text-[10px] font-semibold text-[var(--color-text-muted)] uppercase">Enforcer Protocol</h4>
      <div className="space-y-1">
        {ENFORCER_CHECKLIST.map((item) => (
          <div
            key={item.id}
            className="flex items-center gap-2 p-2 rounded bg-[var(--color-bg-card)] border border-[var(--color-border)]"
          >
            <div
              className={`w-2 h-2 rounded-full ${
                item.status === 'pass' ? 'bg-[var(--color-success)]' : 'bg-[var(--color-amber)]'
              }`}
            />
            <span className="font-mono text-[10px]">{item.label}</span>
          </div>
        ))}
      </div>
      <h4 className="font-mono text-[10px] font-semibold text-[var(--color-text-muted)] uppercase">Rule Status</h4>
      <p className="font-mono text-[10px] text-[var(--color-text-secondary)]">
        Rules applied from global Cursor config. See .cursor/rules/
      </p>
      <h4 className="font-mono text-[10px] font-semibold text-[var(--color-text-muted)] uppercase">MCP Health</h4>
      <p className="font-mono text-[10px] text-[var(--color-text-secondary)]">
        MCP: config.superbots.link/mcp/sse
      </p>
    </div>
  )
}
