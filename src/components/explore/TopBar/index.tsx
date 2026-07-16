import { motion } from 'framer-motion'
import { Pause, Play, TimerReset } from 'lucide-react';
import { SettingsPopover, type SceneSettings } from '@/components/explore/SettingsPopover'
import './TopBar.css'

interface TopBarProps {
  autoRotate: boolean
  onToggleAutoRotate: () => void
  onResetView: () => void
  settings: SceneSettings
  onChangeSettings: (settings: SceneSettings) => void
}

const TAP_TRANSITION = { duration: 0.15 }

export function TopBar({ autoRotate, onToggleAutoRotate, onResetView, settings, onChangeSettings }: TopBarProps) {
  return (
    <header className="top-bar">
      <div className="top-bar-controls">
        <motion.button
          className="toggle-btn glass-btn"
          onClick={onToggleAutoRotate}
          whileTap={{ scale: 0.86 }}
          transition={TAP_TRANSITION}
        >
          <motion.div
            className="icon-morph"
            initial={false}
            animate={{ rotate: autoRotate ? 180 : 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
          >
            {autoRotate ? <Pause /> : <Play />}
          </motion.div>
        </motion.button>
        <motion.button
          className="toggle-btn glass-btn"
          onClick={onResetView}
          whileTap={{ scale: 0.86 }}
          transition={TAP_TRANSITION}
        >
          <TimerReset />
        </motion.button>
        <SettingsPopover settings={settings} onChange={onChangeSettings} />
      </div>
    </header>
  )
}
