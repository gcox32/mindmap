import { Pencil, Trash2 } from 'lucide-react'
import type { GraphNode } from '@/data/types'
import { NODE_COLOR } from '@/graph/style'
import { ConfirmModal } from '@/components/ui/ConfirmModal'
import type { NodeManagerState } from './useNodeManager'

interface NodeListProps {
  nodes: GraphNode[]
  manager: NodeManagerState
}

export function NodeList({ nodes, manager }: NodeListProps) {
  const { editingId, busy, deleteTarget, setDeleteTarget, startEdit, confirmDelete } = manager

  return (
    <>
      <div className="manage-panel-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h3 className="manage-panel-title">Nodes</h3>
      </div>

      <div className="manage-list">
        {nodes.map((node) => (
          <div key={node.id} className={`manage-list-row${editingId === node.id ? ' manage-list-row--active' : ''}`}>
            <span className="type-dot" style={{ background: NODE_COLOR[node.type] }} />
            <span className="manage-list-label">
              {node.label} <span className="manage-list-sub">{node.id}</span>
            </span>
            <span className="manage-list-actions">
              <button className="icon-btn" onClick={() => startEdit(node)} aria-label={`Edit ${node.label}`}>
                <Pencil size={14} />
              </button>
              <button
                className="icon-btn icon-btn--danger"
                onClick={() => setDeleteTarget(node)}
                aria-label={`Delete ${node.label}`}
                disabled={busy}
              >
                <Trash2 size={14} />
              </button>
            </span>
          </div>
        ))}
      </div>

      <ConfirmModal
        isOpen={deleteTarget !== null}
        title="Delete node"
        message={`Delete node "${deleteTarget?.id}"? Edges connected to it will also be deleted.`}
        busy={busy}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  )
}
