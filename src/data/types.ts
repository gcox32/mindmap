export type NodeType = 'nucleus' | 'source' | 'process' | 'output' | 'stakeholder'

export type NodeSubtype =
  | 'api'
  | 'database'
  | 'server'
  | 'object-storage'
  | 'scraper'
  | 'ftp'
  | 'script'
  | 'cron-script'
  | 'child-script'
  | 'website'
  | 'email'
  | 'sql-table'
  | 'pdf'

export interface GraphNode {
  id: string
  type: NodeType
  subtype?: NodeSubtype
  label: string
  description?: string
  /**
   * Single canonical descriptive value for this node's subtype (or, for
   * stakeholders, its type) — e.g. a cron expression for cron-script, a
   * file path for script/child-script, a URL for website. Meaning and
   * label are looked up per subtype via NODE_PRIMARY_ATTRIBUTE_LABEL in
   * graph/style.ts. Free text rather than per-subtype typed fields, so it
   * doubles as a groupable value (e.g. stakeholders by department).
   */
  primaryAttribute?: string
}

/**
 * `hosts` marks tight structural coupling (e.g. a server hosting the database it runs), not a data flow.
 * `spawns` vs `calls`: both are control flow between scripts, not data flow (that's `feeds`/`produces`).
 * `spawns` is fan-out — a script forking concurrent worker instances. `calls` is a sequential one-to-one
 * handoff to the next stage in a pipeline.
 */
export type EdgeKind = 'feeds' | 'spawns' | 'calls' | 'produces' | 'cycles' | 'hosts'

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
