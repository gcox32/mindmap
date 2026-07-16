import { useState } from 'react'
import { Pencil, Trash2, Plus, X } from 'lucide-react'
import type { GraphNode, NodeSubtype, NodeType } from '@/data/types'
import { NODE_COLOR } from '@/graph/style'

interface NodeManagerProps {
  nodes: GraphNode[]
  onCreate: (node: GraphNode) => Promise<void>
  onUpdate: (id: string, node: GraphNode) => Promise<void>
  onDelete: (id: string) => Promise<void>
}

const NODE_TYPES: NodeType[] = ['nucleus', 'source', 'process', 'output']
const NODE_SUBTYPES: NodeSubtype[] = [
  'api',
  'database',
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

type FormState = {
  id: string
  type: NodeType
  subtype: NodeSubtype | ''
  label: string
  description: string
  schedule: string
}

const EMPTY_FORM: FormState = { id: '', type: 'source', subtype: '', label: '', description: '', schedule: '' }

function toForm(node: GraphNode): FormState {
  return {
    id: node.id,
    type: node.type,
    subtype: node.subtype ?? '',
    label: node.label,
    description: node.description ?? '',
    schedule: node.schedule ?? '',
  }
}

function toNode(form: FormState): GraphNode {
  return {
    id: form.id.trim(),
    type: form.type,
    subtype: form.subtype || undefined,
    label: form.label.trim(),
    description: form.description.trim() || undefined,
    schedule: form.schedule.trim() || undefined,
  }
}

export function NodeManager({ nodes, onCreate, onUpdate, onDelete }: NodeManagerProps) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<FormState | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const startCreate = () => {
    setEditingId(null)
    setForm(EMPTY_FORM)
    setError(null)
  }

  const startEdit = (node: GraphNode) => {
    setEditingId(node.id)
    setForm(toForm(node))
    setError(null)
  }

  const cancel = () => {
    setForm(null)
    setEditingId(null)
    setError(null)
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm(`Delete node "${id}"? Edges connected to it will also be deleted.`)) return
    setBusy(true)
    setError(null)
    try {
      await onDelete(id)
      if (editingId === id) cancel()
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setBusy(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form) return
    if (!form.id.trim() || !form.label.trim()) {
      setError('id and label are required')
      return
    }
    setBusy(true)
    setError(null)
    try {
      const node = toNode(form)
      if (editingId) {
        await onUpdate(editingId, node)
      } else {
        await onCreate(node)
      }
      cancel()
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <div className="manage-panel-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h3 className="manage-panel-title">Nodes</h3>
        <button className="icon-btn glass-btn" onClick={startCreate} aria-label="New node">
          <Plus size={16} />
        </button>
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
                onClick={() => handleDelete(node.id)}
                aria-label={`Delete ${node.label}`}
                disabled={busy}
              >
                <Trash2 size={14} />
              </button>
            </span>
          </div>
        ))}
      </div>

      {form && (
        <form className="manage-form" onSubmit={handleSubmit}>
          <div className="field-row">
            <label className="field">
              id
              <input
                value={form.id}
                disabled={!!editingId}
                onChange={(e) => setForm({ ...form, id: e.target.value })}
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
            <input value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} />
          </label>

          <div className="field-row">
            <label className="field">
              subtype
              <select value={form.subtype} onChange={(e) => setForm({ ...form, subtype: e.target.value as NodeSubtype | '' })}>
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
            <textarea
              rows={2}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </label>

          {error && <div className="form-error">{error}</div>}

          <div className="form-actions">
            <button type="submit" className="primary-btn" disabled={busy}>
              {editingId ? 'Save' : 'Create'}
            </button>
            <button type="button" className="text-btn" onClick={cancel}>
              <X size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />
              Cancel
            </button>
          </div>
        </form>
      )}
    </>
  )
}
