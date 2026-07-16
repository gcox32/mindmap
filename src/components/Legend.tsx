import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { EDGE_COLOR, NODE_COLOR } from '../graph/style'

interface LegendProps {
  statusLine: string
}

const NODE_ENTRIES: Array<{ type: keyof typeof NODE_COLOR; label: string }> = [
  { type: 'nucleus', label: 'Nucleus' },
  { type: 'source', label: 'Source' },
  { type: 'process', label: 'Process' },
  { type: 'output', label: 'Output' },
]

const EDGE_ENTRIES: Array<{ kind: keyof typeof EDGE_COLOR; label: string }> = [
  { kind: 'feeds', label: 'feeds' },
  { kind: 'spawns', label: 'spawns' },
  { kind: 'produces', label: 'produces' },
  { kind: 'cycles', label: 'cycles back' },
]

export function Legend({ statusLine }: LegendProps) {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div className="panel legend">
      <div className="legend-header">
        <div className="legend-status">{statusLine}</div>
        <motion.button
          className="legend-toggle glass-btn"
          onClick={() => setCollapsed((v) => !v)}
          aria-label={collapsed ? 'Expand legend' : 'Collapse legend'}
          whileTap={{ scale: 0.86 }}
          transition={{ duration: 0.15 }}
        >
          {collapsed ? '▸' : '▾'}
        </motion.button>
      </div>

      <AnimatePresence initial={false}>
        {!collapsed && (
          <motion.div
            key="legend-content"
            className="legend-content"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
          >
            <div className="legend-divider" />
            <div className="legend-section">
              {NODE_ENTRIES.map((entry) => (
                <div className="legend-row" key={entry.type}>
                  <span className="type-dot" style={{ background: NODE_COLOR[entry.type] }} />
                  {entry.label}
                </div>
              ))}
            </div>
            <div className="legend-divider" />
            <div className="legend-section">
              {EDGE_ENTRIES.map((entry) => (
                <div className="legend-row" key={entry.kind}>
                  <span className="edge-swatch" style={{ background: EDGE_COLOR[entry.kind] }} />
                  {entry.label}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
