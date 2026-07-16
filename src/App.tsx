import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Scene } from './components/scene/Scene'
import { InfoPanel } from './components/ui/InfoPanel'
import { Legend } from './components/ui/Legend'
import { TopBar } from './components/ui/TopBar'
import { SearchBar } from './components/ui/SearchBar'
import { ActionPills } from './components/ui/ActionPills'
import { LiquidGlassDefs } from './components/ui/LiquidGlassDefs'
import { nodes, edges } from './data/dummyData'
import type { FocusMode } from './graph/traversal'

function App() {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [autoRotate, setAutoRotate] = useState(true)
  const [focusMode, setFocusMode] = useState<FocusMode>('neighbors')
  const [searchQuery, setSearchQuery] = useState('')
  const [resetSignal, setResetSignal] = useState(0)
  const searchInputRef = useRef<HTMLInputElement>(null)

  const selectedNode = nodes.find((n) => n.id === selectedId) ?? null
  const hoveredNode = nodes.find((n) => n.id === hoveredId) ?? null

  const searchMatchIds = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return null
    return new Set(nodes.filter((n) => n.label.toLowerCase().includes(q)).map((n) => n.id))
  }, [searchQuery])

  const handleSelect = (id: string | null) => {
    setSelectedId(id)
    setFocusMode('neighbors')
  }

  const handleResetView = () => {
    handleSelect(null)
    setResetSignal((v) => v + 1)
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleSelect(null)
        return
      }

      const isMod = e.metaKey || e.ctrlKey
      if (!isMod) return

      if (e.key.toLowerCase() === 'p') {
        e.preventDefault()
        setAutoRotate((v) => !v)
      } else if (e.key.toLowerCase() === 'r') {
        e.preventDefault()
        handleResetView()
      } else if (e.key.toLowerCase() === 'k') {
        e.preventDefault()
        searchInputRef.current?.focus()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const statusLine = selectedNode
    ? `Inspecting ${selectedNode.label}`
    : hoveredNode
      ? hoveredNode.label
      : `${nodes.length} nodes · ${edges.length} connections`

  return (
    <div className="app">
      <LiquidGlassDefs />
      <Scene
        nodes={nodes}
        edges={edges}
        selectedId={selectedId}
        hoveredId={hoveredId}
        onHover={setHoveredId}
        onSelect={handleSelect}
        autoRotate={autoRotate}
        focusMode={focusMode}
        searchMatchIds={searchMatchIds}
        resetSignal={resetSignal}
      />

      <TopBar
        autoRotate={autoRotate}
        onToggleAutoRotate={() => setAutoRotate((v) => !v)}
        onResetView={handleResetView}
      />

      <InfoPanel
        node={selectedNode}
        nodes={nodes}
        edges={edges}
        onSelect={handleSelect}
        onClose={() => handleSelect(null)}
      />

      <Legend statusLine={statusLine} />

      <div className="bottom-stack">
        <motion.div layout transition={{ duration: 0.3, ease: 'easeInOut' }} className="bottom-stack-inner">
          <AnimatePresence initial={false}>
            {selectedNode && (
              <motion.div
                key="action-pills"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2, ease: 'easeInOut' }}
                style={{ overflow: 'hidden', width: '100%' }}
              >
                <ActionPills
                  nodeLabel={selectedNode.label}
                  focusMode={focusMode}
                  onSetFocusMode={setFocusMode}
                  onClose={() => handleSelect(null)}
                />
              </motion.div>
            )}
          </AnimatePresence>

          <motion.div layout style={{ width: '100%' }}>
            <SearchBar
              ref={searchInputRef}
              value={searchQuery}
              matchCount={searchMatchIds ? searchMatchIds.size : null}
              onChange={setSearchQuery}
            />
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}

export default App
