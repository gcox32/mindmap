import { useMemo, useState } from 'react'
import type { GraphNode } from '@/data/types'
import { NODE_COLOR } from '@/graph/style'
import type { NodeManagerState } from './useNodeManager'

interface NodeListProps {
  nodes: GraphNode[]
  manager: NodeManagerState
}

export function NodeList({ nodes, manager }: NodeListProps) {
  const { editingId, startEdit } = manager
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return nodes
    return nodes.filter(
      (node) =>
        node.label.toLowerCase().includes(q) ||
        node.id.toLowerCase().includes(q) ||
        node.type.toLowerCase().includes(q) ||
        (node.subtype ?? '').toLowerCase().includes(q),
    )
  }, [nodes, search])

  return (
    <>
      <div className="manage-panel-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h3 className="manage-panel-title">Nodes</h3>
      </div>

      <input
        className="manage-search"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search nodes..."
      />

      <div className="manage-list">
        {filtered.map((node) => (
          <button
            type="button"
            key={node.id}
            className={`manage-list-row${editingId === node.id ? ' manage-list-row--active' : ''}`}
            onClick={() => startEdit(node)}
          >
            <span className="type-dot" style={{ background: NODE_COLOR[node.type] }} />
            <span className="manage-list-label">
              {node.label} <span className="manage-list-sub">{node.id}</span>
            </span>
          </button>
        ))}
      </div>
    </>
  )
}
