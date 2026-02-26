/**
 * pow3r.control - Dashboard Grid
 *
 * Purpose:
 * - Widget-based overview of entire platform health
 * - Max 520px card width per user design rules
 * - Responsive: stack on mobile, wrap on desktop
 * - Bottom nav bar layout (fixed bottom)
 */
import { HealthWidget } from './HealthWidget'
import { ActiveWorkflowsWidget } from './ActiveWorkflowsWidget'
import { XFilesSummaryWidget } from './XFilesSummaryWidget'
import { GuardianSummaryWidget } from './GuardianSummaryWidget'
import { TelemetryWidget } from './TelemetryWidget'

export function DashboardGrid() {
  return (
    <div className="w-full h-full overflow-y-auto bg-[var(--color-bg-deep)] p-4">
      <div className="max-w-[1100px] mx-auto">
        <div className="flex flex-wrap gap-4 justify-center">
          <HealthWidget />
          <TelemetryWidget />
          <GuardianSummaryWidget />
          <XFilesSummaryWidget />
          <ActiveWorkflowsWidget />
        </div>
      </div>
    </div>
  )
}
