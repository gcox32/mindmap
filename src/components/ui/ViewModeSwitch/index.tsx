import { SegmentedControl } from '@/components/ui/SegmentedControl'
import './ViewModeSwitch.css'

export type ViewMode = 'overview' | 'explore' | 'manage'

interface ViewModeSwitchProps {
  viewMode: ViewMode
  onChange: (mode: ViewMode) => void
}

const MODES: Array<{ value: ViewMode; label: string }> = [
  { value: 'overview', label: 'View' },
  { value: 'explore', label: 'Explore' },
  { value: 'manage', label: 'Manage' },
]

export function ViewModeSwitch({ viewMode, onChange }: ViewModeSwitchProps) {
  return (
    <div className="view-mode-switch">
      <SegmentedControl groupId="view-mode" options={MODES} value={viewMode} onChange={onChange} />
    </div>
  )
}
