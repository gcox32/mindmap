import { useMemo } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import type { GraphEdge, GraphNode } from '../data/types'
import { NODE_COLOR } from '../graph/style'
import { computeFocusSet } from '../graph/traversal'

interface InfoPanelProps {
  node: GraphNode | null
  nodes: GraphNode[]
  edges: GraphEdge[]
  onSelect: (id: string) => void
  onClose: () => void
}

const EDGE_KIND_LABEL: Record<GraphEdge['kind'], string> = {
  feeds: 'feeds into',
  spawns: 'spawns',
  produces: 'produces',
  cycles: 'cycles back into',
}

export function InfoPanel({ node, nodes, edges, onSelect, onClose }: InfoPanelProps) {
  const nodeById = useMemo(() => new Map(nodes.map((n) => [n.id, n])), [nodes])

  const outgoing = useMemo(() => (node ? edges.filter((e) => e.source === node.id) : []), [node, edges])
  const incoming = useMemo(() => (node ? edges.filter((e) => e.target === node.id) : []), [node, edges])

  const upstreamCount = useMemo(
    () => (node ? computeFocusSet(node.id, edges, 'upstream').size - 1 : 0),
    [node, edges],
  )
  const downstreamCount = useMemo(
    () => (node ? computeFocusSet(node.id, edges, 'downstream').size - 1 : 0),
    [node, edges],
  )

  return (
    <motion.div
      layout
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className={`panel info-panel${node ? '' : ' info-panel--empty'}`}
    >
      {node && (
        <motion.button
          className="close-btn glass-btn"
          onClick={onClose}
          aria-label="Close"
          whileTap={{ scale: 0.86 }}
          transition={{ duration: 0.15 }}
        >
          ×
        </motion.button>
      )}

      <AnimatePresence mode="wait" initial={false}>
        {!node ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <p className="hint">Click a node to inspect it. Drag to orbit, scroll to zoom.</p>
          </motion.div>
        ) : (
          <motion.div
            key={node.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
          >
            <div className="info-header">
              <span className="type-dot" style={{ background: NODE_COLOR[node.type] }} />
              <div>
                <h2>{node.label}</h2>
                <span className="subtype">
                  {node.type}
                  {node.subtype ? ` · ${node.subtype}` : ''}
                </span>
              </div>
            </div>

            {node.description && <p className="description">{node.description}</p>}
            {node.schedule && (
              <p className="schedule">
                <span className="label-tag">schedule</span> <code>{node.schedule}</code>
              </p>
            )}

            <div className="stat-grid">
              <div className="stat-cell">
                <span className="stat-label">Upstream</span>
                <span className="stat-value">{upstreamCount}</span>
              </div>
              <div className="stat-cell">
                <span className="stat-label">Downstream</span>
                <span className="stat-value">{downstreamCount}</span>
              </div>
            </div>

            {incoming.length > 0 && (
              <div className="connection-group">
                <h3>Fed by</h3>
                <ul>
                  {incoming.map((e) => {
                    const other = nodeById.get(e.source)
                    if (!other) return null
                    return (
                      <li key={e.source}>
                        <button className="link-btn glass-btn" onClick={() => onSelect(other.id)}>
                          {other.label}
                        </button>
                        <span className="edge-kind">{EDGE_KIND_LABEL[e.kind]}</span>
                      </li>
                    )
                  })}
                </ul>
              </div>
            )}

            {outgoing.length > 0 && (
              <div className="connection-group">
                <h3>Connects to</h3>
                <ul>
                  {outgoing.map((e) => {
                    const other = nodeById.get(e.target)
                    if (!other) return null
                    return (
                      <li key={e.target}>
                        <span className="edge-kind">{EDGE_KIND_LABEL[e.kind]}</span>
                        <button className="link-btn glass-btn" onClick={() => onSelect(other.id)}>
                          {other.label}
                        </button>
                      </li>
                    )
                  })}
                </ul>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
