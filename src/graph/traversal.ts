import type { GraphEdge } from '@/data/types'

export type FocusMode = 'neighbors' | 'upstream' | 'downstream'

/**
 * Nodes to highlight around `focusId`. 'neighbors' is a single hop in either
 * direction; 'upstream'/'downstream' walk the full transitive chain, so a
 * traced node lights up everything that ever feeds it or everything it ever
 * feeds, however many hops away.
 */
export function computeFocusSet(focusId: string, edges: GraphEdge[], mode: FocusMode): Set<string> {
  const ids = new Set<string>([focusId])

  if (mode === 'neighbors') {
    for (const e of edges) {
      if (e.source === focusId) ids.add(e.target)
      if (e.target === focusId) ids.add(e.source)
    }
    return ids
  }

  const queue = [focusId]
  while (queue.length > 0) {
    const current = queue.shift()!
    for (const e of edges) {
      if (mode === 'downstream' && e.source === current && !ids.has(e.target)) {
        ids.add(e.target)
        queue.push(e.target)
      }
      if (mode === 'upstream' && e.target === current && !ids.has(e.source)) {
        ids.add(e.source)
        queue.push(e.source)
      }
    }
  }
  return ids
}

/** Count of edges touching each node id, used for hub badges. */
export function computeDegree(edges: GraphEdge[]): Map<string, number> {
  const degree = new Map<string, number>()
  for (const e of edges) {
    degree.set(e.source, (degree.get(e.source) ?? 0) + 1)
    degree.set(e.target, (degree.get(e.target) ?? 0) + 1)
  }
  return degree
}
