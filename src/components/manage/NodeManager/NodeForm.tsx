import { motion } from 'framer-motion'
import { Plus } from 'lucide-react'
import type { GraphNode, NodeSubtype, NodeType } from '@/data/types'
import { ConfirmModal } from '@/components/ui/ConfirmModal'
import type { NodeManagerState } from './useNodeManager'

const TAP_TRANSITION = { duration: 0.15 }

const NODE_TYPES: NodeType[] = ['nucleus', 'source', 'process', 'output', 'stakeholder']
const NODE_SUBTYPES: NodeSubtype[] = [
  'api',
  'database',
  'server',
  'object-storage',
  'scraper',
  'ftp',
  'script',
  'cron-script',
  'child-script',
  'website',
  'email',
  'sql-table',
  'slack',
  'pdf',
  'archive',
]

interface NodeFormProps {
  nodes: GraphNode[]
  manager: NodeManagerState
}

export function NodeForm({ nodes, manager }: NodeFormProps) {
  const {
    editingId,
    form,
    setForm,
    error,
    busy,
    deleteTarget,
    setDeleteTarget,
    startCreate,
    setId,
    setLabel,
    confirmDelete,
    handleSubmit,
  } = manager
  const editingNode = editingId ? nodes.find((n) => n.id === editingId) ?? null : null

  return (
    <>
      <div className="manage-panel-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h3 className="manage-panel-title">{editingId ? 'Edit Node' : 'New Node'}</h3>
        <motion.button
          className="icon-btn glass-btn"
          onClick={startCreate}
          aria-label={editingId ? 'Cancel edit' : 'Reset form'}
          whileTap={{ scale: 0.86 }}
          animate={{ rotate: editingId ? 135 : 0 }}
          transition={TAP_TRANSITION}
        >
          <Plus size={16} />
        </motion.button>
      </div>

      <form className="manage-form" onSubmit={handleSubmit}>
        <div className="field-row">
          <label className="field">
            id
            <input
              value={form.id}
              disabled={!!editingId}
              onChange={(e) => setId(e.target.value)}
              placeholder="unique-slug"
            />
          </label>
          <label className="field">
            type
            <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as NodeType })}>
              {NODE_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label className="field">
          label
          <input value={form.label} onChange={(e) => setLabel(e.target.value)} />
        </label>

        <div className="field-row">
          <label className="field">
            subtype
            <select
              value={form.subtype}
              onChange={(e) => setForm({ ...form, subtype: e.target.value as NodeSubtype | '' })}
            >
              <option value="">(none)</option>
              {NODE_SUBTYPES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            schedule
            <input
              value={form.schedule}
              onChange={(e) => setForm({ ...form, schedule: e.target.value })}
              placeholder="* * * * *"
            />
          </label>
        </div>

        <label className="field">
          description
          <textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </label>

        {error && <div className="form-error">{error}</div>}

        <div className="form-actions">
          <button type="submit" className="primary-btn" disabled={busy}>
            {editingId ? 'Save' : 'Create'}
          </button>
          {editingNode && (
            <button
              type="button"
              className="primary-btn primary-btn--danger"
              onClick={() => setDeleteTarget(editingNode)}
              disabled={busy}
            >
              Delete
            </button>
          )}
        </div>
      </form>

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
