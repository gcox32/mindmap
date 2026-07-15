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
            {label}
          </button>
        ))}
      </div>
      <button className="pill-btn pill-btn--close" onClick={onClose}>
        Clear
      </button>
    </div>
  )
}
