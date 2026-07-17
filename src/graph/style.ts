import type { EdgeKind, NodeSubtype, NodeType } from '@/data/types'

// Label for each subtype's single `primaryAttribute` value (see types.ts).
// Stakeholder has no subtype, so it's keyed by type instead as a fallback.
const PRIMARY_ATTRIBUTE_LABEL_BY_SUBTYPE: Partial<Record<NodeSubtype, string>> = {
  'cron-script': 'Schedule',
  script: 'Path',
  'child-script': 'Path',
  api: 'Endpoint',
  database: 'Engine',
  server: 'Host',
  'object-storage': 'Bucket',
  scraper: 'Target',
  ftp: 'Host',
  website: 'Address',
  email: 'Recipients',
  'sql-table': 'Table',
  pdf: 'Path',
}

const PRIMARY_ATTRIBUTE_LABEL_BY_TYPE: Partial<Record<NodeType, string>> = {
  stakeholder: 'Department',
}

export function getPrimaryAttributeLabel(node: { type: NodeType; subtype?: NodeSubtype }): string | undefined {
  return (node.subtype && PRIMARY_ATTRIBUTE_LABEL_BY_SUBTYPE[node.subtype]) ?? PRIMARY_ATTRIBUTE_LABEL_BY_TYPE[node.type]
}

// Deep-blue palette anchored on #2C3855 — hue stays constant, only
// lightness/saturation shift to distinguish node types (nucleus brightest,
// output darkest/most desaturated).
export const NODE_COLOR: Record<NodeType, string> = {
  nucleus: '#eaf1ff',
  source: '#8fb8ff',
  process: '#5c85c2',
  output: '#3d5279',
  stakeholder: '#293654',
}

const BASE_RADIUS_BY_TYPE: Record<NodeType, number> = {
  nucleus: 8,
  source: 3.2,
  process: 2.8,
  output: 2.8,
  stakeholder: 2.8,
}

// Subtypes that behave like shared infrastructure hubs in a real system
// (databases, object stores) get a deliberate size bump. This is a stand-in
// for "this naturally has more connections" decided by what the node *is*,
// rather than sizing dynamically off the current graph's edge count.
// `server` outranks `database` here — it's the host the database runs on,
// higher in the hierarchy even though both are plain `source` subtypes —
// and the two stay visually tight via the short `hosts` edge (see
// useGraphLayout.ts), not via node size alone.
const RADIUS_BONUS_BY_SUBTYPE: Partial<Record<NodeSubtype, number>> = {
  server: 3,
  database: 2.2,
  'object-storage': 1.6,
  'sql-table': 1.2,
}

export function getNodeRadius(node: { type: NodeType; subtype?: NodeSubtype }): number {
  const bonus = node.subtype ? (RADIUS_BONUS_BY_SUBTYPE[node.subtype] ?? 0) : 0
  return BASE_RADIUS_BY_TYPE[node.type] + bonus
}

// Connectors stay near-white/pale-blue like fine constellation lines; the one
// warm exception is `cycles`, which marks a feedback loop and should read as
// a distinct, deliberate signal rather than blend in.
export const EDGE_COLOR: Record<EdgeKind, string> = {
  feeds: '#dce6f7',
  spawns: '#b9cdec',
  calls: '#b9cdec',
  produces: '#eef3fc',
  cycles: '#ff6b6b',
  hosts: '#ffd685',
}

export const EDGE_DASHED: Record<EdgeKind, boolean> = {
  feeds: false,
  spawns: false,
  calls: false,
  produces: false,
  cycles: true,
  hosts: false,
}

const VOLUME_RANGE: [number, number] = [1, 10]

/**
 * Subtle width multiplier from edge volume/frequency — a gentle nudge, not a
 * dominant signal, so it layers on top of (rather than competes with) the
 * existing highlighted/dimmed line-width states.
 */
export function widthMultiplierForVolume(volume: number): number {
  const [min, max] = VOLUME_RANGE
  const t = Math.min(1, Math.max(0, (volume - min) / (max - min)))
  return 0.75 + t * 0.6 // 0.75x (rare) .. 1.35x (near-continuous)
}

export const BACKGROUND_COLOR = '#060911'
export const PANEL_BASE_COLOR = '#2c3855'

/** Deterministic 0..1 hash from a string id, used to desync per-node animation phase. */
export function hashToUnit(id: string): number {
  let h = 0
  for (let i = 0; i < id.length; i++) {
    h = (h << 5) - h + id.charCodeAt(i)
    h |= 0
  }
  return (h >>> 0) / 0xffffffff
}
