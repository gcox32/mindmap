import './OverviewStats.css'

interface OverviewStatsProps {
  nodeCount: number
  edgeCount: number
  errorCount: number
  warningCount: number
}

export function OverviewStats({ nodeCount, edgeCount, errorCount, warningCount }: OverviewStatsProps) {
  const entries: Array<{ label: string; value: number; tone?: 'warning' | 'danger' }> = [
    { label: 'Nodes', value: nodeCount },
    { label: 'Connections', value: edgeCount },
    { label: 'Errors · 1h', value: errorCount, tone: errorCount > 0 ? 'danger' : undefined },
    { label: 'Warnings · 1h', value: warningCount, tone: warningCount > 0 ? 'warning' : undefined },
  ]

  return (
    <div className="overview-stats">
      {entries.map((entry) => (
        <div className="overview-stat" key={entry.label}>
          <span className={`overview-stat-value${entry.tone ? ` overview-stat-value--${entry.tone}` : ''}`}>
            {entry.value}
          </span>
          <span className="overview-stat-label">{entry.label}</span>
        </div>
      ))}
    </div>
  )
}
