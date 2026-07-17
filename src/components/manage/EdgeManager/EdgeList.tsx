import { Pencil, Trash2 } from 'lucide-react'
import type { GraphEdge } from '@/data/types'
import { EDGE_COLOR } from '@/graph/style'
import { ConfirmModal } from '@/components/ui/ConfirmModal'
import type { EdgeManagerState } from './useEdgeManager'

interface EdgeListProps {
  edges: GraphEdge[]
  manager: EdgeManagerState
}

export function EdgeList({ edges, manager }: EdgeListProps) {
  const { nodeById, editingId, busy, deleteTarget, setDeleteTarget, startEdit, confirmDelete } = manager

  return (
    <>
      <div className="manage-panel-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h3 className="manage-panel-title">Edges</h3>
      </div>

      <div className="manage-list">
        {edges.map((edge) => {
          const source = nodeById.get(edge.source)
          const target = nodeById.get(edge.target)
          return (
            <div key={edge.id} className={`manage-list-row${editingId === edge.id ? ' manage-list-row--active' : ''}`}>
              <span className="type-dot" style={{ background: EDGE_COLOR[edge.kind] }} />
              <span className="manage-list-label">
                {source?.label ?? edge.source} → {target?.label ?? edge.target}{' '}
                <span className="manage-list-sub">
                  {edge.kind} · {edge.volume}
                </span>
              </span>
              <span className="manage-list-actions">
                <button className="icon-btn" onClick={() => startEdit(edge)} aria-label="Edit edge">
                  <Pencil size={14} />
                </button>
                <button
                  className="icon-btn icon-btn--danger"
                  onClick={() => setDeleteTarget(edge)}
                  aria-label="Delete edge"
                  disabled={busy}
                >
                  <Trash2 size={14} />
                </button>
              </span>
            </div>
          )
        })}
      </div>

      <ConfirmModal
        isOpen={deleteTarget !== null}
        title="Delete edge"
        message="Delete this edge?"
        busy={busy}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  )
}
