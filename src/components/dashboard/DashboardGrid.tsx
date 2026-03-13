/**
 * pow3r.control - Dashboard Grid
 *
 * Purpose:
 * - Widget-based overview of entire platform health
 * - Max 520px card width per user design rules
 * - Responsive: stack on mobile, wrap on desktop
 * - All widgets use live API data
 */
import { HealthWidget } from './HealthWidget'
import { ActiveWorkflowsWidget } from './ActiveWorkflowsWidget'
import { XFilesSummaryWidget } from './XFilesSummaryWidget'
import { GuardianSummaryWidget } from './GuardianSummaryWidget'
import { TelemetryWidget } from './TelemetryWidget'
import { UnifiedStatusWidget } from './UnifiedStatusWidget'
import { PlanOverlayWidget } from './PlanOverlayWidget'
import { DeploymentFeedWidget } from './DeploymentFeedWidget'

export function DashboardGrid() {
  return (
    <div className="w-full h-full overflow-y-auto bg-[var(--color-bg-deep)] px-5 py-5">
      <div className="max-w-[1100px] mx-auto">
        <div className="flex flex-wrap gap-5 justify-center">
          <UnifiedStatusWidget />
          <HealthWidget />
          <TelemetryWidget />
          <GuardianSummaryWidget />
          <PlanOverlayWidget />
          <XFilesSummaryWidget />
          <ActiveWorkflowsWidget />
          <DeploymentFeedWidget />
        </div>
      </div>
    </div>
  )
}
