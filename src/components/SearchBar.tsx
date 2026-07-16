import { forwardRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Search } from 'lucide-react'

interface SearchBarProps {
  value: string
  matchCount: number | null
  onChange: (value: string) => void
}

export const SearchBar = forwardRef<HTMLInputElement, SearchBarProps>(function SearchBar(
  { value, matchCount, onChange },
  ref,
) {
  const [isFocused, setIsFocused] = useState(false)

  return (
    <motion.div
      className="panel search-bar"
      animate={{ scale: isFocused ? 1.05 : 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
    >
      <Search />
      <input
        ref={ref}
        type="text"
        placeholder="Search nodes..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
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
            <button className="close-btn search-clear glass-btn" onClick={() => onChange('')} aria-label="Clear search">
              ×
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
})
