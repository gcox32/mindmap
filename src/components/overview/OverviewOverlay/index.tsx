import { useMemo } from 'react'
import { motion } from 'framer-motion'
import type { GraphEdge, GraphNode } from '@/data/types'
import { activityFeed, systemStatus, throughputHistory } from '@/data/overviewData'
import { OverviewStats } from '@/components/overview/OverviewStats'
import { OverviewBreakdown } from '@/components/overview/OverviewBreakdown'
import { OverviewActivity } from '@/components/overview/OverviewActivity'
import { OverviewStatus } from '@/components/overview/OverviewStatus'
import { OverviewThroughput } from '@/components/overview/OverviewThroughput'
import './OverviewOverlay.css'

interface OverviewOverlayProps {
  nodes: GraphNode[]
  edges: GraphEdge[]
}

export function OverviewOverlay({ nodes, edges }: OverviewOverlayProps) {
  const errorCount = useMemo(() => activityFeed.filter((e) => e.level === 'error').length, [])
  const warningCount = useMemo(() => activityFeed.filter((e) => e.level === 'warning').length, [])

  return (
    <motion.div
      className="overview-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
    >
      <OverviewStats
        nodeCount={nodes.length}
        edgeCount={edges.length}
        errorCount={errorCount}
        warningCount={warningCount}
      />
      <div className="overview-right-column">
        <OverviewBreakdown nodes={nodes} />
        <OverviewActivity entries={activityFeed} />
      </div>
      <OverviewStatus status={systemStatus} />
      <OverviewThroughput history={throughputHistory} />
    </motion.div>
  )
}
