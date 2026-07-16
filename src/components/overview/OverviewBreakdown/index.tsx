import { useMemo } from 'react'
import type { GraphNode, NodeType } from '@/data/types'
import { NODE_COLOR } from '@/graph/style'
import './OverviewBreakdown.css'

interface OverviewBreakdownProps {
  nodes: GraphNode[]
}

const TYPE_ENTRIES: Array<{ type: NodeType; label: string }> = [
  { type: 'source', label: 'Sources' },
  { type: 'process', label: 'Processes' },
  { type: 'output', label: 'Outputs' },
]

export function OverviewBreakdown({ nodes }: OverviewBreakdownProps) {
  const counts = useMemo(() => {
    const map = new Map<NodeType, number>()
    for (const node of nodes) map.set(node.type, (map.get(node.type) ?? 0) + 1)
    return map
  }, [nodes])

  return (
    <div className="overview-breakdown">
      <h3 className="overview-panel-title">Node Types</h3>
      <div className="overview-breakdown-list">
        {TYPE_ENTRIES.map((entry) => (
          <div className="overview-breakdown-row" key={entry.type}>
            <span className="type-dot" style={{ background: NODE_COLOR[entry.type] }} />
            <span className="overview-breakdown-label">{entry.label}</span>
            <span className="overview-breakdown-count">{counts.get(entry.type) ?? 0}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
