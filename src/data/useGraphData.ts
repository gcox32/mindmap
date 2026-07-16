import { useCallback, useEffect, useState } from 'react'
import type { GraphEdge, GraphNode } from './types'
import * as api from './api'

interface GraphDataState {
  nodes: GraphNode[]
  edges: GraphEdge[]
  loading: boolean
  error: string | null
}

/**
 * Single source of truth for nodes/edges fetched from the backend. Mutations
 * always reload both lists afterward rather than patching local state, since
 * CRUD actions are infrequent and this keeps the client trivially consistent
 * with the server (no risk of optimistic state drifting from what's stored).
 */
export function useGraphData() {
  const [state, setState] = useState<GraphDataState>({ nodes: [], edges: [], loading: true, error: null })

  const reload = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }))
    try {
      const [nodes, edges] = await Promise.all([api.fetchNodes(), api.fetchEdges()])
      setState({ nodes, edges, loading: false, error: null })
    } catch (err) {
      setState((s) => ({ ...s, loading: false, error: err instanceof Error ? err.message : String(err) }))
    }
  }, [])

  useEffect(() => {
    reload()
  }, [reload])

  const createNode = useCallback(async (node: GraphNode) => {
    await api.createNode(node)
    await reload()
  }, [reload])

  const updateNode = useCallback(async (id: string, node: GraphNode) => {
    await api.updateNode(id, node)
    await reload()
  }, [reload])

  const deleteNode = useCallback(async (id: string) => {
    await api.deleteNode(id)
    await reload()
  }, [reload])

  const createEdge = useCallback(async (edge: GraphEdge) => {
    await api.createEdge(edge)
    await reload()
  }, [reload])

  const updateEdge = useCallback(async (id: string, edge: GraphEdge) => {
    await api.updateEdge(id, edge)
    await reload()
  }, [reload])

  const deleteEdge = useCallback(async (id: string) => {
    await api.deleteEdge(id)
    await reload()
  }, [reload])

  return {
    ...state,
    reload,
    createNode,
    updateNode,
    deleteNode,
    createEdge,
    updateEdge,
    deleteEdge,
  }
}
