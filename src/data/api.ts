import type { GraphEdge, GraphNode } from './types'

class ApiError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/api${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  })

  if (!res.ok) {
    const body = await res.json().catch(() => null)
    throw new ApiError(body?.error ?? `Request failed with status ${res.status}`, res.status)
  }

  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}

export function fetchNodes(): Promise<GraphNode[]> {
  return request('/nodes')
}

export function createNode(node: GraphNode): Promise<GraphNode> {
  return request('/nodes', { method: 'POST', body: JSON.stringify(node) })
}

export function updateNode(id: string, node: GraphNode): Promise<GraphNode> {
  return request(`/nodes/${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify(node) })
}

export function deleteNode(id: string): Promise<void> {
  return request(`/nodes/${encodeURIComponent(id)}`, { method: 'DELETE' })
}

export function fetchEdges(): Promise<GraphEdge[]> {
  return request('/edges')
}

export function createEdge(edge: GraphEdge): Promise<GraphEdge> {
  return request('/edges', { method: 'POST', body: JSON.stringify(edge) })
}

export function updateEdge(id: string, edge: GraphEdge): Promise<GraphEdge> {
  return request(`/edges/${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify(edge) })
}

export function deleteEdge(id: string): Promise<void> {
  return request(`/edges/${encodeURIComponent(id)}`, { method: 'DELETE' })
}
