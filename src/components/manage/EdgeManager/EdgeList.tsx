import { useMemo, useState } from 'react'
import type { GraphEdge } from '@/data/types'
import { EDGE_COLOR } from '@/graph/style'
import type { EdgeManagerState } from './useEdgeManager'

interface EdgeListProps {
  edges: GraphEdge[]
  manager: EdgeManagerState
}

export function EdgeList({ edges, manager }: EdgeListProps) {
  const { nodeById, editingId, startEdit } = manager
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return edges
    return edges.filter((edge) => {
      const source = nodeById.get(edge.source)
      const target = nodeById.get(edge.target)
      return (
        (source?.label ?? edge.source).toLowerCase().includes(q) ||
        (target?.label ?? edge.target).toLowerCase().includes(q) ||
        edge.kind.toLowerCase().includes(q) ||
        edge.id.toLowerCase().includes(q)
      )
    })
  }, [edges, nodeById, search])

  return (
    <>
      <div className="manage-panel-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h3 className="manage-panel-title">Edges</h3>
      </div>

      <input
        className="manage-search"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search edges..."
      />

      <div className="manage-list">
        {filtered.map((edge) => {
          const source = nodeById.get(edge.source)
          const target = nodeById.get(edge.target)
          return (
            <button
              type="button"
              key={edge.id}
              className={`manage-list-row${editingId === edge.id ? ' manage-list-row--active' : ''}`}
              onClick={() => startEdit(edge)}
            >
              <span className="type-dot" style={{ background: EDGE_COLOR[edge.kind] }} />
              <span className="manage-list-label">
                {source?.label ?? edge.source} → {target?.label ?? edge.target}{' '}
                <span className="manage-list-sub">
                  {edge.kind} · {edge.volume}
                </span>
              </span>
            </button>
          )
        })}
      </div>
    </>
  )
}
