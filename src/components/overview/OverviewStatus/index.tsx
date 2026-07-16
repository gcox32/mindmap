import type { systemStatus as SystemStatus } from '@/data/overviewData'
import './OverviewStatus.css'

interface OverviewStatusProps {
  status: typeof SystemStatus
}

export function OverviewStatus({ status }: OverviewStatusProps) {
  return (
    <div className="overview-status">
      <span className={`overview-status-dot overview-status-dot--${status.state}`} />
      <div>
        <div className="overview-status-message">{status.message}</div>
        <div className="overview-status-detail">{status.detail}</div>
      </div>
    </div>
  )
}
