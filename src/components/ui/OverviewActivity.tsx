import type { ActivityEntry } from '../../data/overviewData'
import './OverviewActivity.css'

interface OverviewActivityProps {
  entries: ActivityEntry[]
}

export function OverviewActivity({ entries }: OverviewActivityProps) {
  return (
    <div className="overview-activity">
      <h3 className="overview-panel-title">Recent Activity</h3>
      <ul className="overview-activity-list">
        {entries.map((entry) => (
          <li className="overview-activity-row" key={entry.id}>
            <span className={`overview-activity-dot overview-activity-dot--${entry.level}`} />
            <div className="overview-activity-body">
              <span className="overview-activity-message">{entry.message}</span>
              <span className="overview-activity-time">{entry.time}</span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
