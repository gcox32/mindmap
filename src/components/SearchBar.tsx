import { AnimatePresence, motion } from 'framer-motion'
import { Search } from 'lucide-react'

interface SearchBarProps {
  value: string
  matchCount: number | null
  onChange: (value: string) => void
}

export function SearchBar({ value, matchCount, onChange }: SearchBarProps) {
  return (
    <div className="panel search-bar">
      <Search />
      <input
        type="text"
        placeholder="Search nodes..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      <AnimatePresence>
        {value && (
          <motion.div
            key="search-actions"
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: 'auto' }}
            exit={{ opacity: 0, width: 0 }}
            transition={{ duration: 0.15 }}
            style={{ display: 'flex', alignItems: 'center', gap: 10, overflow: 'hidden' }}
          >
            {matchCount !== null && (
              <span className="search-count">
                {matchCount} match{matchCount === 1 ? '' : 'es'}
              </span>
            )}
            <button className="close-btn search-clear" onClick={() => onChange('')} aria-label="Clear search">
              ×
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
