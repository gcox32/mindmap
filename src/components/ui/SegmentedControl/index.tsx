import { motion } from 'framer-motion'
import './SegmentedControl.css'

interface SegmentedControlOption<T extends string> {
  value: T
  label: string
}

interface SegmentedControlProps<T extends string> {
  /** Unique per on-screen instance — namespaces the shared-layout thumb animation. */
  groupId: string
  options: Array<SegmentedControlOption<T>>
  value: T
  onChange: (value: T) => void
}

export function SegmentedControl<T extends string>({ groupId, options, value, onChange }: SegmentedControlProps<T>) {
  return (
    <div className="pill-group">
      {options.map((option) => (
        <button
          key={option.value}
          className={`pill-btn ${value === option.value ? 'pill-btn--active' : ''}`}
          onClick={() => onChange(option.value)}
        >
          {value === option.value && (
            <motion.div
              className="pill-thumb"
              layoutId={`${groupId}-thumb`}
              transition={{ type: 'spring', stiffness: 500, damping: 40 }}
            >
              <motion.div
                key={value}
                className="pill-thumb-fill"
                initial={{ scaleX: 1.18 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 0.42, ease: [0.34, 1.56, 0.64, 1] }}
              />
            </motion.div>
          )}
          <span className="pill-btn-label">{option.label}</span>
        </button>
      ))}
    </div>
  )
}
