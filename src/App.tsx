import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import './App.css'
import { Scene } from '@/components/scene/Scene'
import { InfoPanel } from '@/components/explore/InfoPanel'
import { Legend } from '@/components/explore/Legend'
import { TopBar } from '@/components/explore/TopBar'
import { SearchBar } from '@/components/explore/SearchBar'
import { ActionPills } from '@/components/explore/ActionPills'
import { LiquidGlassDefs } from '@/components/ui/LiquidGlassDefs'
import { ViewModeSwitch, type ViewMode } from '@/components/ui/ViewModeSwitch'
import { DEFAULT_SCENE_SETTINGS, type SceneSettings } from '@/components/explore/SettingsPopover'
import { OverviewOverlay } from '@/components/overview/OverviewOverlay'
import { nodes, edges } from '@/data/dummyData'
import type { FocusMode } from '@/graph/traversal'

function App() {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [autoRotate, setAutoRotate] = useState(true)
  const [focusMode, setFocusMode] = useState<FocusMode>('neighbors')
  const [searchQuery, setSearchQuery] = useState('')
  const [resetSignal, setResetSignal] = useState(0)
  const [viewMode, setViewMode] = useState<ViewMode>('explore')
  const [settings, setSettings] = useState<SceneSettings>(DEFAULT_SCENE_SETTINGS)
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

  const handleSetViewMode = (mode: ViewMode) => {
    setViewMode(mode)
    handleSelect(null)
    setSearchQuery('')
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleSelect(null)
        setSearchQuery('')
        searchInputRef.current?.blur()
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
      } else if (e.key.toLowerCase() === 'o') {
        e.preventDefault()
        handleSetViewMode('overview')
      } else if (e.key.toLowerCase() === 'e') {
        e.preventDefault()
        handleSetViewMode('explore')
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const statusLine = selectedNode
    ? `Inspecting ${selectedNode.label}`
    : hoveredNode
      ? hoveredNode.label
      : `Legend`

  const isExplore = viewMode === 'explore'

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
        viewMode={viewMode}
        settings={settings}
      />

      <ViewModeSwitch viewMode={viewMode} onChange={handleSetViewMode} />

      <AnimatePresence mode="wait" initial={false}>
        {isExplore ? (
          <motion.div
            key="explore-chrome"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
          >
            <TopBar
              autoRotate={autoRotate}
              onToggleAutoRotate={() => setAutoRotate((v) => !v)}
              onResetView={handleResetView}
              settings={settings}
              onChangeSettings={setSettings}
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
          </motion.div>
        ) : (
          <OverviewOverlay key="overview-chrome" nodes={nodes} edges={edges} />
        )}
      </AnimatePresence>
    </div>
  )
}

export default App
