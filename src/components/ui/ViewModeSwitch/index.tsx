import { SegmentedControl } from '@/components/ui/SegmentedControl'
import './ViewModeSwitch.css'

export type ViewMode = 'overview' | 'explore'

interface ViewModeSwitchProps {
  viewMode: ViewMode
  onChange: (mode: ViewMode) => void
}

const MODES: Array<{ value: ViewMode; label: string }> = [
  { value: 'overview', label: 'Overview' },
  { value: 'explore', label: 'Explore' },
]

export function ViewModeSwitch({ viewMode, onChange }: ViewModeSwitchProps) {
  return (
    <div className="view-mode-switch">
      <SegmentedControl groupId="view-mode" options={MODES} value={viewMode} onChange={onChange} />
    </div>
  )
}
