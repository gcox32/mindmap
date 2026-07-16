import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Settings } from 'lucide-react'
import './SettingsPopover.css'

export interface SceneSettings {
  showOrbitHalos: boolean
}

export const DEFAULT_SCENE_SETTINGS: SceneSettings = {
  showOrbitHalos: true,
}

interface SettingsPopoverProps {
  settings: SceneSettings
  onChange: (settings: SceneSettings) => void
}

const TAP_TRANSITION = { duration: 0.15 }

export function SettingsPopover({ settings, onChange }: SettingsPopoverProps) {
  const [isOpen, setIsOpen] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isOpen) return
    const handlePointerDown = (e: PointerEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('pointerdown', handlePointerDown)
    return () => document.removeEventListener('pointerdown', handlePointerDown)
  }, [isOpen])

  return (
    <div className="settings-popover-wrap" ref={wrapRef}>
      <motion.button
        className="toggle-btn glass-btn"
        onClick={() => setIsOpen((v) => !v)}
        aria-label="Settings"
        whileTap={{ scale: 0.86 }}
        transition={TAP_TRANSITION}
      >
        <Settings />
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="settings-popover"
            className="panel settings-popover"
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.15, ease: 'easeInOut' }}
          >
            <div className="settings-popover-title">Display</div>
            <label className="settings-row">
              <span>Orbit halos</span>
              <span className="settings-switch">
                <input
                  type="checkbox"
                  checked={settings.showOrbitHalos}
                  onChange={(e) => onChange({ ...settings, showOrbitHalos: e.target.checked })}
                />
                <span className="settings-switch-track" />
                <span className="settings-switch-thumb" />
              </span>
            </label>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
