import { motion } from 'framer-motion'
import type { GraphEdge, GraphNode } from '@/data/types'
import { NodeManager } from '@/components/manage/NodeManager'
import { EdgeManager } from '@/components/manage/EdgeManager'
import './ManageOverlay.css'

const SPRING_GENTLE = { type: 'spring', stiffness: 300, damping: 28 } as const

interface ManageOverlayProps {
  nodes: GraphNode[]
  edges: GraphEdge[]
  onCreateNode: (node: GraphNode) => Promise<void>
  onUpdateNode: (id: string, node: GraphNode) => Promise<void>
  onDeleteNode: (id: string) => Promise<void>
  onCreateEdge: (edge: GraphEdge) => Promise<void>
  onUpdateEdge: (id: string, edge: GraphEdge) => Promise<void>
  onDeleteEdge: (id: string) => Promise<void>
}

export function ManageOverlay({
  nodes,
  edges,
  onCreateNode,
  onUpdateNode,
  onDeleteNode,
  onCreateEdge,
  onUpdateEdge,
  onDeleteEdge,
}: ManageOverlayProps) {
  return (
    <motion.div
      className="manage-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
    >
      <motion.div 
        className="manage-panel" 
        layout 
        transition={SPRING_GENTLE}
      >
        <NodeManager nodes={nodes} onCreate={onCreateNode} onUpdate={onUpdateNode} onDelete={onDeleteNode} />
      </motion.div>
      <motion.div className="manage-panel" layout transition={SPRING_GENTLE}>
        <EdgeManager nodes={nodes} edges={edges} onCreate={onCreateEdge} onUpdate={onUpdateEdge} onDelete={onDeleteEdge} />
      </motion.div>
    </motion.div>
  )
}
