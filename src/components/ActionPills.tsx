import { motion } from 'framer-motion'
import type { FocusMode } from '../graph/traversal'

interface ActionPillsProps {
  nodeLabel: string
  focusMode: FocusMode
  onSetFocusMode: (mode: FocusMode) => void
  onClose: () => void
}

const MODES: Array<{ mode: FocusMode; label: string }> = [
  { mode: 'neighbors', label: 'Neighbors' },
  { mode: 'upstream', label: 'Trace Upstream' },
  { mode: 'downstream', label: 'Trace Downstream' },
]

export function ActionPills({ nodeLabel, focusMode, onSetFocusMode, onClose }: ActionPillsProps) {
  return (
    <div className="panel action-pills">
      <span className="action-pills-label">{nodeLabel}</span>
      <div className="pill-group">
        {MODES.map(({ mode, label }) => (
          <button
            key={mode}
            className={`pill-btn ${focusMode === mode ? 'pill-btn--active' : ''}`}
            onClick={() => onSetFocusMode(mode)}
          >
            {focusMode === mode && (
              <motion.div
                className="pill-thumb"
                layoutId="pill-thumb"
                transition={{ type: 'spring', stiffness: 500, damping: 40 }}
              >
                <motion.div
                  key={focusMode}
                  className="pill-thumb-fill"
                  initial={{ scaleX: 1.18 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: 0.42, ease: [0.34, 1.56, 0.64, 1] }}
                />
              </motion.div>
            )}
            <span className="pill-btn-label">{label}</span>
          </button>
        ))}
      </div>
      <motion.button
        className="pill-btn pill-btn--close glass-btn"
        onClick={onClose}
        whileTap={{ scale: 0.86 }}
        transition={{ duration: 0.15 }}
      >
        Clear
      </motion.button>
    </div>
  )
}
