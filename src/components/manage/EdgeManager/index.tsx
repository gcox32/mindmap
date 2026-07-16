import { useMemo, useState } from 'react'
import { Pencil, Trash2, Plus, X } from 'lucide-react'
import type { EdgeKind, GraphEdge, GraphNode } from '@/data/types'
import { EDGE_COLOR } from '@/graph/style'

interface EdgeManagerProps {
  nodes: GraphNode[]
  edges: GraphEdge[]
  onCreate: (edge: GraphEdge) => Promise<void>
  onUpdate: (id: string, edge: GraphEdge) => Promise<void>
  onDelete: (id: string) => Promise<void>
}

const EDGE_KINDS: EdgeKind[] = ['feeds', 'spawns', 'produces', 'cycles']

type FormState = {
  id: string
  source: string
  target: string
  kind: EdgeKind
  volume: string
}

function emptyForm(nodes: GraphNode[]): FormState {
  return { id: '', source: nodes[0]?.id ?? '', target: nodes[0]?.id ?? '', kind: 'feeds', volume: '1' }
}

function toForm(edge: GraphEdge): FormState {
  return { id: edge.id, source: edge.source, target: edge.target, kind: edge.kind, volume: String(edge.volume) }
}

function toEdge(form: FormState): GraphEdge {
  return {
    id: form.id.trim(),
    source: form.source,
    target: form.target,
    kind: form.kind,
    volume: Number(form.volume) || 1,
  }
}

export function EdgeManager({ nodes, edges, onCreate, onUpdate, onDelete }: EdgeManagerProps) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<FormState | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const nodeById = useMemo(() => new Map(nodes.map((n) => [n.id, n])), [nodes])

  const startCreate = () => {
    setEditingId(null)
    setForm(emptyForm(nodes))
    setError(null)
  }

  const startEdit = (edge: GraphEdge) => {
    setEditingId(edge.id)
    setForm(toForm(edge))
    setError(null)
  }

  const cancel = () => {
    setForm(null)
    setEditingId(null)
    setError(null)
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this edge?')) return
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
    if (!form.id.trim() || !form.source || !form.target) {
      setError('id, source, and target are required')
      return
    }
    setBusy(true)
    setError(null)
    try {
      const edge = toEdge(form)
      if (editingId) {
        await onUpdate(editingId, edge)
      } else {
        await onCreate(edge)
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
        <h3 className="manage-panel-title">Edges</h3>
        <button className="icon-btn glass-btn" onClick={startCreate} aria-label="New edge" disabled={nodes.length === 0}>
          <Plus size={16} />
        </button>
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
                  onClick={() => handleDelete(edge.id)}
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

      {form && (
        <form className="manage-form" onSubmit={handleSubmit}>
          <label className="field">
            id
            <input
              value={form.id}
              disabled={!!editingId}
              onChange={(e) => setForm({ ...form, id: e.target.value })}
              placeholder="unique-slug"
            />
          </label>

          <div className="field-row">
            <label className="field">
              source
              <select value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })}>
                {nodes.map((n) => (
                  <option key={n.id} value={n.id}>
                    {n.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              target
              <select value={form.target} onChange={(e) => setForm({ ...form, target: e.target.value })}>
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
              <select value={form.kind} onChange={(e) => setForm({ ...form, kind: e.target.value as EdgeKind })}>
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
