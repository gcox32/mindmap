import { motion } from 'framer-motion'
import type { FocusMode } from '../../graph/traversal'
import { SegmentedControl } from './SegmentedControl'
import './ActionPills.css'

interface ActionPillsProps {
  focusMode: FocusMode
  onSetFocusMode: (mode: FocusMode) => void
  onClose: () => void
}

const MODES: Array<{ value: FocusMode; label: string }> = [
  { value: 'neighbors', label: 'Neighbors' },
  { value: 'upstream', label: 'Trace Upstream' },
  { value: 'downstream', label: 'Trace Downstream' },
]

export function ActionPills({ focusMode, onSetFocusMode, onClose }: ActionPillsProps) {
  return (
    <div className="panel action-pills">
      <SegmentedControl groupId="focus-mode" options={MODES} value={focusMode} onChange={onSetFocusMode} />
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
