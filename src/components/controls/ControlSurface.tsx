/**
 * pow3r.control - Resolume-Inspired Control Surface
 *
 * Purpose:
 * - Real-time manipulation panel inspired by Resolume RenderRabbit VJ controller
 * - 7 vertical faders controlling layer visibility (Topology -> Meta)
 * - Telemetry density knob
 * - Health meter (real-time compliance)
 * - Mode quick-switch buttons
 *
 * Design reference: docs/design/Particles/Overview_fx.jpg (Resolume RenderRabbit)
 *
 * Agent Instructions:
 * - This gives a physical-instrument feel to architecture analysis
 * - Faders map to layerVisibility in the Zustand store
 * - The CTO can "perform" analysis by blending layers
 */
import { useControlStore } from '../../store/control-store'
import { useXSystemStore } from '../../store/x-system-store'

const LAYERS = [
  { key: 'topology', label: 'TOPO', color: 'var(--color-cyan)' },
  { key: 'governance', label: 'GOV', color: 'var(--color-success)' },
  { key: 'orchestration', label: 'ORCH', color: 'var(--color-purple)' },
  { key: 'observability', label: 'OBS', color: 'var(--color-amber)' },
  { key: 'intelligence', label: 'INT', color: '#60B5FF' },
  { key: 'configuration', label: 'CFG', color: '#FF90BB' },
  { key: 'meta', label: 'META', color: '#888888' },
] as const

export function ControlSurface() {
  const show = useControlStore((s) => s.showControlSurface)
  const toggle = useControlStore((s) => s.toggleControlSurface)
  const layerVisibility = useControlStore((s) => s.layerVisibility)
  const setLayerVisibility = useControlStore((s) => s.setLayerVisibility)
  const telemetryDensity = useControlStore((s) => s.telemetryDensity)
  const setTelemetryDensity = useControlStore((s) => s.setTelemetryDensity)
  const config = useControlStore((s) => s.config)
  const viewMode = useControlStore((s) => s.viewMode)
  const setViewMode = useControlStore((s) => s.setViewMode)

  const isConnected = useXSystemStore((s) => s.isConnected)
  const eventCount = useXSystemStore((s) => s.eventCount)

  if (!show) return null

  const compliance = config?.compliance.compliance_score ?? 0

  return (
    <div className="absolute top-0 right-0 w-64 h-full bg-[var(--color-bg-panel)] border-l border-[var(--color-border)] z-25 flex flex-col select-none">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-[var(--color-border)] shrink-0">
        <span className="font-mono text-[10px] font-semibold text-[var(--color-text-primary)] uppercase tracking-wider">
          Control Surface
        </span>
        <button
          onClick={toggle}
          className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] text-lg leading-none"
        >
          x
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-5">
        {/* Layer Faders */}
        <div>
          <span className="font-mono text-[8px] text-[var(--color-text-muted)] uppercase tracking-widest">
            Layer Mix
          </span>
          <div className="flex gap-2 mt-2 h-32">
            {LAYERS.map(({ key, label, color }) => {
              const value = layerVisibility[key as keyof typeof layerVisibility] ?? 1
              return (
                <div key={key} className="flex flex-col items-center flex-1">
                  {/* Fader track */}
                  <div className="relative flex-1 w-3 bg-[var(--color-bg-card)] rounded-full overflow-hidden">
                    <div
                      className="absolute bottom-0 w-full rounded-full transition-all duration-150"
                      style={{ height: `${value * 100}%`, backgroundColor: color, opacity: 0.6 }}
                    />
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={Math.round(value * 100)}
                      onChange={(e) => setLayerVisibility(key, parseInt(e.target.value) / 100)}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      style={{ writingMode: 'vertical-lr', direction: 'rtl' }}
                    />
                  </div>
                  {/* Value */}
                  <span className="font-mono text-[7px] mt-1" style={{ color }}>
                    {Math.round(value * 100)}
                  </span>
                  {/* Label */}
                  <span className="font-mono text-[7px] text-[var(--color-text-muted)]">{label}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Telemetry Density */}
        <div>
          <div className="flex items-center justify-between">
            <span className="font-mono text-[8px] text-[var(--color-text-muted)] uppercase tracking-widest">
              Telemetry Density
            </span>
            <span className="font-mono text-[9px] text-[var(--color-cyan)]">
              {Math.round(telemetryDensity * 100)}%
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={Math.round(telemetryDensity * 100)}
            onChange={(e) => setTelemetryDensity(parseInt(e.target.value) / 100)}
            className="w-full h-1.5 mt-1.5 appearance-none bg-[var(--color-bg-card)] rounded-full cursor-pointer
              [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 
              [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[var(--color-cyan)]"
          />
        </div>

        {/* Health Meter */}
        <div>
          <span className="font-mono text-[8px] text-[var(--color-text-muted)] uppercase tracking-widest">
            System Health
          </span>
          <div className="mt-1.5 h-3 bg-[var(--color-bg-card)] rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${compliance * 100}%`,
                backgroundColor: compliance > 0.8 ? 'var(--color-success)' : compliance > 0.5 ? 'var(--color-amber)' : 'var(--color-error)',
              }}
            />
          </div>
          <div className="flex justify-between mt-0.5 font-mono text-[8px] text-[var(--color-text-muted)]">
            <span>0%</span>
            <span className="text-[var(--color-text-secondary)]">{Math.round(compliance * 100)}%</span>
            <span>100%</span>
          </div>
        </div>

        {/* Session info */}
        <div>
          <span className="font-mono text-[8px] text-[var(--color-text-muted)] uppercase tracking-widest">
            Session
          </span>
          <div className="mt-1.5 space-y-1 font-mono text-[9px]">
            <div className="flex justify-between">
              <span className="text-[var(--color-text-muted)]">X-Stream</span>
              <div className="flex items-center gap-1">
                <div className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-[var(--color-success)]' : 'bg-[var(--color-error)]'}`} />
                <span className="text-[var(--color-text-secondary)]">{isConnected ? 'live' : 'off'}</span>
              </div>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--color-text-muted)]">Events</span>
              <span className="text-[var(--color-text-secondary)]">{eventCount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--color-text-muted)]">Nodes</span>
              <span className="text-[var(--color-text-secondary)]">{config?.nodes.length ?? 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--color-text-muted)]">Edges</span>
              <span className="text-[var(--color-text-secondary)]">{config?.edges.length ?? 0}</span>
            </div>
          </div>
        </div>

        {/* Quick Mode Switch */}
        <div>
          <span className="font-mono text-[8px] text-[var(--color-text-muted)] uppercase tracking-widest">
            View Mode
          </span>
          <div className="grid grid-cols-2 gap-1.5 mt-1.5">
            {(['2d', '3d', 'timeline', 'dashboard'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`py-1.5 rounded font-mono text-[9px] font-semibold uppercase transition-colors ${
                  viewMode === mode
                    ? 'bg-[var(--color-cyan)] text-[var(--color-bg-deep)]'
                    : 'bg-[var(--color-bg-card)] text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Footer branding */}
      <div className="px-3 py-2 border-t border-[var(--color-border)] shrink-0">
        <span className="font-mono text-[7px] text-[var(--color-text-muted)] uppercase tracking-widest">
          pow3r.control v1.0
        </span>
      </div>
    </div>
  )
}
