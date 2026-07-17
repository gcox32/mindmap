import { motion } from 'framer-motion'
import { Plus } from 'lucide-react'
import type { EdgeKind, GraphNode } from '@/data/types'
import type { EdgeManagerState } from './useEdgeManager'

const TAP_TRANSITION = { duration: 0.15 }

const EDGE_KINDS: EdgeKind[] = ['feeds', 'spawns', 'produces', 'cycles', 'hosts']

interface EdgeFormProps {
  nodes: GraphNode[]
  manager: EdgeManagerState
}

export function EdgeForm({ nodes, manager }: EdgeFormProps) {
  const { editingId, form, setForm, error, busy, startCreate, setId, setSource, setTarget, setKind, handleSubmit } = manager

  return (
    <>
      <div className="manage-panel-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h3 className="manage-panel-title">{editingId ? 'Edit Edge' : 'New Edge'}</h3>
        <motion.button
          className="icon-btn glass-btn"
          onClick={startCreate}
          aria-label={editingId ? 'Cancel edit' : 'Reset form'}
          disabled={!editingId && nodes.length === 0}
          whileTap={{ scale: 0.86 }}
          animate={{ rotate: editingId ? 135 : 0 }}
          transition={TAP_TRANSITION}
        >
          <Plus size={16} />
        </motion.button>
      </div>

      <form className="manage-form" onSubmit={handleSubmit}>
        <label className="field">
          id
          <input
            value={form.id}
            disabled={!!editingId}
            onChange={(e) => setId(e.target.value)}
            placeholder="unique-slug"
          />
        </label>

        <div className="field-row">
          <label className="field">
            source
            <select value={form.source} onChange={(e) => setSource(e.target.value)}>
              {nodes.map((n) => (
                <option key={n.id} value={n.id}>
                  {n.label}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            target
            <select value={form.target} onChange={(e) => setTarget(e.target.value)}>
              {nodes.map((n) => (
                <option key={n.id} value={n.id}>
                  {n.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="field-row">
          <label className="field">
            kind
            <select value={form.kind} onChange={(e) => setKind(e.target.value as EdgeKind)}>
              {EDGE_KINDS.map((k) => (
                <option key={k} value={k}>
                  {k}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            volume
            <input
              type="number"
              min={1}
              max={10}
              value={form.volume}
              onChange={(e) => setForm({ ...form, volume: e.target.value })}
            />
          </label>
        </div>

        {error && <div className="form-error">{error}</div>}

        <div className="form-actions">
          <button type="submit" className="primary-btn" disabled={busy}>
            {editingId ? 'Save' : 'Create'}
          </button>
        </div>
      </form>
    </>
  )
}
