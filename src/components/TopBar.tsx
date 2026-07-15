import { Pause, Play, TimerReset } from 'lucide-react';

interface TopBarProps {
  autoRotate: boolean
  onToggleAutoRotate: () => void
  onResetView: () => void
}

export function TopBar({ autoRotate, onToggleAutoRotate, onResetView }: TopBarProps) {
  return (
    <header className="top-bar">
      <div className="top-bar-controls">
        <button className="toggle-btn" onClick={onToggleAutoRotate}>
          { autoRotate ? 
            <Pause />:
            <Play />
          }
        </button>
        <button className="toggle-btn" onClick={onResetView}>
          <TimerReset />
        </button>
      </div>
    </header>
  )
}
