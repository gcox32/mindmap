declare module 'd3-force-3d' {
  export interface SimulationNodeDatum3D {
    index?: number
    x?: number
    y?: number
    z?: number
    vx?: number
    vy?: number
    vz?: number
    fx?: number | null
    fy?: number | null
    fz?: number | null
  }

  export interface SimulationLinkDatum3D<N extends SimulationNodeDatum3D> {
    source: string | N
    target: string | N
  }

  export interface Simulation<N extends SimulationNodeDatum3D> {
    nodes(): N[]
    nodes(nodes: N[]): this
    force(name: string): unknown
    force(name: string, force: unknown | null): this
    alpha(): number
    alpha(alpha: number): this
    alphaMin(): number
    alphaMin(min: number): this
    tick(iterations?: number): this
    stop(): this
    restart(): this
  }

  export function forceSimulation<N extends SimulationNodeDatum3D>(nodes?: N[], numDimensions?: number): Simulation<N>

  export interface ManyBodyForce {
    strength(strength: number | ((node: unknown, i: number) => number)): this
    (): void
  }
  export function forceManyBody(): ManyBodyForce

  export interface LinkForce<N extends SimulationNodeDatum3D, L extends SimulationLinkDatum3D<N>> {
    id(id: (node: N) => string): this
    links(links: L[]): this
    distance(distance: number | ((link: L) => number)): this
    strength(strength: number | ((link: L) => number)): this
    (): void
  }
  export function forceLink<N extends SimulationNodeDatum3D, L extends SimulationLinkDatum3D<N>>(links?: L[]): LinkForce<N, L>

  export interface CenterForce {
    (): void
  }
  export function forceCenter(x?: number, y?: number, z?: number): CenterForce

  export interface CollideForce {
    radius(radius: number | ((node: unknown) => number)): this
    (): void
  }
  export function forceCollide(): CollideForce
}
