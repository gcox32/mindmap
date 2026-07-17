import { useState } from 'react'
import type { GraphNode, NodeSubtype, NodeType } from '@/data/types'

export type NodeFormState = {
  id: string
  type: NodeType
  subtype: NodeSubtype | ''
  label: string
  description: string
  primaryAttribute: string
}

const EMPTY_FORM: NodeFormState = { id: '', type: 'source', subtype: '', label: '', description: '', primaryAttribute: '' }

function toForm(node: GraphNode): NodeFormState {
  return {
    id: node.id,
    type: node.type,
    subtype: node.subtype ?? '',
    label: node.label,
    description: node.description ?? '',
    primaryAttribute: node.primaryAttribute ?? '',
  }
}

function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function toNode(form: NodeFormState): GraphNode {
  return {
    id: form.id.trim(),
    type: form.type,
    subtype: form.subtype || undefined,
    label: form.label.trim(),
    description: form.description.trim() || undefined,
    primaryAttribute: form.primaryAttribute.trim() || undefined,
  }
}

interface UseNodeManagerArgs {
  onCreate: (node: GraphNode) => Promise<void>
  onUpdate: (id: string, node: GraphNode) => Promise<void>
  onDelete: (id: string) => Promise<void>
}

export function useNodeManager({ onCreate, onUpdate, onDelete }: UseNodeManagerArgs) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<NodeFormState>(EMPTY_FORM)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<GraphNode | null>(null)
  const [idEdited, setIdEdited] = useState(false)

  const startCreate = () => {
    setEditingId(null)
    setForm(EMPTY_FORM)
    setError(null)
    setIdEdited(false)
  }

  const startEdit = (node: GraphNode) => {
    setEditingId(node.id)
    setForm(toForm(node))
    setError(null)
    setIdEdited(false)
  }

  const setLabel = (label: string) => {
    setForm((prev) => ({ ...prev, label, id: idEdited ? prev.id : slugify(label) }))
  }

  const setId = (id: string) => {
    setIdEdited(true)
    setForm((prev) => ({ ...prev, id }))
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
      startCreate()
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setBusy(false)
    }
  }

  return {
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
    setLabel,
    confirmDelete,
    handleSubmit,
  }
}

export type NodeManagerState = ReturnType<typeof useNodeManager>
