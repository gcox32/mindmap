import { useMemo, useState } from 'react'
import type { EdgeKind, GraphEdge, GraphNode } from '@/data/types'

export type EdgeFormState = {
  id: string
  source: string
  target: string
  kind: EdgeKind
  volume: string
}

function proposeId(source: string, kind: EdgeKind, target: string): string {
  return [source, kind, target].filter(Boolean).join('-')
}

function emptyForm(nodes: GraphNode[]): EdgeFormState {
  const source = nodes[0]?.id ?? ''
  const target = nodes[0]?.id ?? ''
  const kind: EdgeKind = 'feeds'
  return { id: proposeId(source, kind, target), source, target, kind, volume: '1' }
}

function toForm(edge: GraphEdge): EdgeFormState {
  return { id: edge.id, source: edge.source, target: edge.target, kind: edge.kind, volume: String(edge.volume) }
}

function toEdge(form: EdgeFormState): GraphEdge {
  return {
    id: form.id.trim(),
    source: form.source,
    target: form.target,
    kind: form.kind,
    volume: Number(form.volume) || 1,
  }
}

interface UseEdgeManagerArgs {
  nodes: GraphNode[]
  onCreate: (edge: GraphEdge) => Promise<void>
  onUpdate: (id: string, edge: GraphEdge) => Promise<void>
  onDelete: (id: string) => Promise<void>
}

export function useEdgeManager({ nodes, onCreate, onUpdate, onDelete }: UseEdgeManagerArgs) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<EdgeFormState>(() => emptyForm(nodes))
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<GraphEdge | null>(null)
  const [idEdited, setIdEdited] = useState(false)

  const nodeById = useMemo(() => new Map(nodes.map((n) => [n.id, n])), [nodes])

  const startCreate = () => {
    setEditingId(null)
    setForm(emptyForm(nodes))
    setError(null)
    setIdEdited(false)
  }

  const startEdit = (edge: GraphEdge) => {
    setEditingId(edge.id)
    setForm(toForm(edge))
    setError(null)
    setIdEdited(false)
  }

  const setId = (id: string) => {
    setIdEdited(true)
    setForm((prev) => ({ ...prev, id }))
  }

  const setSource = (source: string) => {
    setForm((prev) => ({ ...prev, source, id: idEdited ? prev.id : proposeId(source, prev.kind, prev.target) }))
  }

  const setTarget = (target: string) => {
    setForm((prev) => ({ ...prev, target, id: idEdited ? prev.id : proposeId(prev.source, prev.kind, target) }))
  }

  const setKind = (kind: EdgeKind) => {
    setForm((prev) => ({ ...prev, kind, id: idEdited ? prev.id : proposeId(prev.source, kind, prev.target) }))
  }

  const confirmDelete = async () => {
    if (!deleteTarget) return
    const id = deleteTarget.id
    setBusy(true)
    setError(null)
    try {
      await onDelete(id)
      if (editingId === id) startCreate()
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setBusy(false)
      setDeleteTarget(null)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
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
      startCreate()
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setBusy(false)
    }
  }

  return {
    nodeById,
    editingId,
    form,
    setForm,
    error,
    busy,
    deleteTarget,
    setDeleteTarget,
    startCreate,
    startEdit,
    setId,
    setSource,
    setTarget,
    setKind,
    confirmDelete,
    handleSubmit,
  }
}

export type EdgeManagerState = ReturnType<typeof useEdgeManager>
