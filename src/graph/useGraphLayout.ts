import { useMemo } from 'react'
import { forceSimulation, forceManyBody, forceLink, forceCenter, forceCollide } from 'd3-force-3d'
import type { SimulationNodeDatum3D, SimulationLinkDatum3D } from 'd3-force-3d'
import type { GraphNode, GraphEdge, PositionedNode } from '@/data/types'
import { getNodeRadius } from './style'

// Collision radius scales off the same render radius as NodeMesh (roughly
// 1.8x, to cover the glow sprite + label), so subtype-driven size bumps
// (e.g. databases) also claim proportionally more space in the layout.
const COLLIDE_SCALE = 1.8
const COLLIDE_PADDING = 6

// Nucleus-type nodes get much stronger repulsion than everything else so
// secondary servers hold their own presence and push their satellites into
// a distinct sub-cluster, even though (unlike the primary) they aren't
// pinned and are free to drift as the layout settles.
// server sits above source/database in the hierarchy (it's the host the
// database runs on), so it gets more repulsion than a plain leaf node —
// but nowhere near nucleus, since it isn't a whole regional hub.
const CHARGE_STRENGTH_BY_TYPE: Record<GraphNode['type'], number> = {
  nucleus: -520,
  server: -260,
  source: -140,
  process: -140,
  output: -140,
  stakeholder: -140,
}

// `hosts` (server -> the database it runs) is much shorter than a normal
// data-flow edge, pulling the pair into a tight, visually-coupled unit.
const LINK_DISTANCE_BY_KIND: Record<GraphEdge['kind'], number> = {
  feeds: 34,
  spawns: 20,
  produces: 30,
  cycles: 60,
  hosts: 8,
}

const LINK_STRENGTH_BY_KIND: Partial<Record<GraphEdge['kind'], number>> = {
  hosts: 0.9,
}
const DEFAULT_LINK_STRENGTH = 0.5

type SimNode = GraphNode & SimulationNodeDatum3D
type SimLink = SimulationLinkDatum3D<SimNode> & { kind: GraphEdge['kind'] }

/** Runs a 3D force simulation once (synchronously) and returns final node positions. */
export function computeLayout(nodes: GraphNode[], edges: GraphEdge[]): PositionedNode[] {
  const simNodes: SimNode[] = nodes.map((n) => ({ ...n }))
  const simLinks: SimLink[] = edges.map((e) => ({ source: e.source, target: e.target, kind: e.kind }))

  const simulation = forceSimulation<SimNode>(simNodes, 3)
    .force(
      'charge',
      forceManyBody().strength((d) => CHARGE_STRENGTH_BY_TYPE[(d as SimNode).type]),
    )
    .force(
      'link',
      forceLink<SimNode, SimLink>(simLinks)
        .id((d) => d.id)
        .distance((l) => LINK_DISTANCE_BY_KIND[l.kind])
        .strength((l) => LINK_STRENGTH_BY_KIND[l.kind] ?? DEFAULT_LINK_STRENGTH),
    )
    .force('center', forceCenter(0, 0, 0))
    .force(
      'collide',
      forceCollide().radius((d) => getNodeRadius(d as SimNode) * COLLIDE_SCALE + COLLIDE_PADDING),
    )
    .stop()

  // Only the *first* nucleus (the primary/central server, by data ordering)
  // gets pinned to the world origin — it's the camera's fixed anchor. Any
  // further nucleus-typed nodes (secondary, near-self-contained servers)
  // are intentionally left unpinned; their elevated charge above holds them
  // apart as their own sub-cluster, but they drift with layout changes.
  const primaryNucleus = simNodes.find((n) => n.type === 'nucleus')
  if (primaryNucleus) {
    primaryNucleus.fx = 0
    primaryNucleus.fy = 0
    primaryNucleus.fz = 0
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
