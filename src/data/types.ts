export type NodeType = 'nucleus' | 'source' | 'process' | 'output'

export type NodeSubtype =
  | 'api'
  | 'database'
  | 'object-storage'
  | 'scraper'
  | 'ftp'
  | 'script'
  | 'cron-script'
  | 'child-script'
  | 'website'
  | 'email'
  | 'sql-table'
  | 'slack'
  | 'pdf'
  | 'archive'

export interface GraphNode {
  id: string
  type: NodeType
  subtype?: NodeSubtype
  label: string
  description?: string
  /** e.g. "0 6 * * *" for cron-tied processes */
  schedule?: string
}

export type EdgeKind = 'feeds' | 'spawns' | 'produces' | 'cycles'

export interface GraphEdge {
  id: string
  source: string
  target: string
  kind: EdgeKind
  /** Relative connection frequency/volume, unitless 1 (rare) – 10 (near-continuous). Drives connector line width. */
  volume: number
}

/** Node position after force-layout simulation. */
export interface PositionedNode extends GraphNode {
  x: number
  y: number
  z: number
}
