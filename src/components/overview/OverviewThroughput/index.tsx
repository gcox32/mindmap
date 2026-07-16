import { useMemo, useState } from 'react'
import './OverviewThroughput.css'

interface OverviewThroughputProps {
  history: number[]
}

// A minimum visible height keeps low-volume hours from collapsing to an
// unreadable sliver — the mark still needs to register as "a bar," not a hairline.
const MIN_HEIGHT_PCT = 6

export function OverviewThroughput({ history }: OverviewThroughputProps) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null)
  const max = useMemo(() => Math.max(...history), [history])
  const latest = history[history.length - 1]

  return (
    <div className="overview-throughput">
      <div className="overview-throughput-header">
        <h3 className="overview-panel-title">Throughput</h3>
        <span className="overview-throughput-value">{latest}K records/hr</span>
      </div>

      <div className="overview-throughput-bars">
        {history.map((value, i) => {
          const heightPct = Math.max((value / max) * 100, MIN_HEIGHT_PCT)
          const hoursAgo = history.length - 1 - i
          const isHovered = hoverIndex === i
          return (
            <div
              key={i}
              className="overview-throughput-bar-track"
              onMouseEnter={() => setHoverIndex(i)}
              onMouseLeave={() => setHoverIndex(null)}
            >
              {isHovered && (
                <div className="overview-throughput-tooltip">
                  {value}K · {hoursAgo === 0 ? 'now' : `${hoursAgo}h ago`}
                </div>
              )}
              <div
                className={`overview-throughput-bar${isHovered ? ' overview-throughput-bar--hovered' : ''}`}
                style={{ height: `${heightPct}%` }}
              />
            </div>
          )
        })}
      </div>

      <div className="overview-throughput-axis">
        <span>24h ago</span>
        <span>now</span>
      </div>
    </div>
  )
}
