import { useMemo } from 'react'
import { forceSimulation, forceManyBody, forceLink, forceCenter, forceCollide } from 'd3-force-3d'
import type { SimulationNodeDatum3D, SimulationLinkDatum3D } from 'd3-force-3d'
import type { GraphNode, GraphEdge, PositionedNode } from '../data/types'
import { getNodeRadius } from './style'

// Collision radius scales off the same render radius as NodeMesh (roughly
// 1.8x, to cover the glow sprite + label), so subtype-driven size bumps
// (e.g. databases) also claim proportionally more space in the layout.
const COLLIDE_SCALE = 1.8
const COLLIDE_PADDING = 6

const LINK_DISTANCE_BY_KIND: Record<GraphEdge['kind'], number> = {
  feeds: 34,
  spawns: 20,
  produces: 30,
  cycles: 60,
}

type SimNode = GraphNode & SimulationNodeDatum3D
type SimLink = SimulationLinkDatum3D<SimNode> & { kind: GraphEdge['kind'] }

/** Runs a 3D force simulation once (synchronously) and returns final node positions. */
export function computeLayout(nodes: GraphNode[], edges: GraphEdge[]): PositionedNode[] {
  const simNodes: SimNode[] = nodes.map((n) => ({ ...n }))
  const simLinks: SimLink[] = edges.map((e) => ({ source: e.source, target: e.target, kind: e.kind }))

  const simulation = forceSimulation<SimNode>(simNodes, 3)
    .force('charge', forceManyBody().strength(-140))
    .force(
      'link',
      forceLink<SimNode, SimLink>(simLinks)
        .id((d) => d.id)
        .distance((l) => LINK_DISTANCE_BY_KIND[l.kind])
        .strength(0.5),
    )
    .force('center', forceCenter(0, 0, 0))
    .force(
      'collide',
      forceCollide().radius((d) => getNodeRadius(d as SimNode) * COLLIDE_SCALE + COLLIDE_PADDING),
    )
    .stop()

  const nucleus = simNodes.find((n) => n.type === 'nucleus')
  if (nucleus) {
    nucleus.fx = 0
    nucleus.fy = 0
    nucleus.fz = 0
  }

  const ITERATIONS = 400
  for (let i = 0; i < ITERATIONS; i++) simulation.tick()

  return simNodes.map((n) => ({
    ...n,
    x: n.x ?? 0,
    y: n.y ?? 0,
    z: n.z ?? 0,
  }))
}

/** Memoized layout — recomputes only if the node/edge arrays themselves change identity. */
export function useGraphLayout(nodes: GraphNode[], edges: GraphEdge[]): PositionedNode[] {
  return useMemo(() => computeLayout(nodes, edges), [nodes, edges])
}
