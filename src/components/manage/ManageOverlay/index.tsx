import { motion } from 'framer-motion'
import type { GraphEdge, GraphNode } from '@/data/types'
import { NodeManager } from '@/components/manage/NodeManager'
import { EdgeManager } from '@/components/manage/EdgeManager'
import './ManageOverlay.css'

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
      <div className="panel manage-panel">
        <NodeManager nodes={nodes} onCreate={onCreateNode} onUpdate={onUpdateNode} onDelete={onDeleteNode} />
      </div>
      <div className="panel manage-panel">
        <EdgeManager nodes={nodes} edges={edges} onCreate={onCreateEdge} onUpdate={onUpdateEdge} onDelete={onDeleteEdge} />
      </div>
    </motion.div>
  )
}
