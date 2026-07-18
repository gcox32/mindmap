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
const CHARGE_STRENGTH_BY_TYPE: Record<GraphNode['type'], number> = {
  nucleus: -520,
  source: -140,
  process: -140,
  output: -140,
  stakeholder: -140,
}

// `hosts` (a server subtype -> the database subtype it runs) is much
// shorter than a normal data-flow edge, pulling the pair into a tight,
// visually-coupled unit even though node size/charge already reflect
// server's higher rank via RADIUS_BONUS_BY_SUBTYPE (see style.ts).
const LINK_DISTANCE_BY_KIND: Record<GraphEdge['kind'], number> = {
  feeds: 34,
  spawns: 20,
  calls: 20,
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

// Groups nodes that share a (type, subtype, primaryAttribute) combination —
// e.g. stakeholders with the same department, or later databases with the
// same engine. Nodes without a primaryAttribute aren't clustered.
function clusterKey(n: SimNode): string | undefined {
  return n.primaryAttribute ? `${n.type}::${n.subtype ?? ''}::${n.primaryAttribute}` : undefined
}

const CLUSTER_STRENGTH = 0.15

/** Custom d3 force: pulls each node toward the centroid of its cluster (see clusterKey). */
function forceCluster() {
  let nodes: SimNode[] = []

  function force(alpha: number) {
    const centroids = new Map<string, { x: number; y: number; z: number; count: number }>()
    for (const n of nodes) {
      const key = clusterKey(n)
      if (!key) continue
      const c = centroids.get(key) ?? { x: 0, y: 0, z: 0, count: 0 }
      c.x += n.x ?? 0
      c.y += n.y ?? 0
      c.z += n.z ?? 0
      c.count++
      centroids.set(key, c)
    }

    for (const n of nodes) {
      const key = clusterKey(n)
      if (!key) continue
      const c = centroids.get(key)!
      if (c.count <= 1) continue
      n.vx = (n.vx ?? 0) - ((n.x ?? 0) - c.x / c.count) * CLUSTER_STRENGTH * alpha
      n.vy = (n.vy ?? 0) - ((n.y ?? 0) - c.y / c.count) * CLUSTER_STRENGTH * alpha
      n.vz = (n.vz ?? 0) - ((n.z ?? 0) - c.z / c.count) * CLUSTER_STRENGTH * alpha
    }
  }

  force.initialize = (_nodes: SimNode[]) => {
    nodes = _nodes
  }

  return force
}

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
    .force('cluster', forceCluster())
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
