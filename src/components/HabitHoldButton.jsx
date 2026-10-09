import { useRef, useState } from 'react'
import HoldButton from './HoldButton.jsx'
import Icon from './Icon.jsx'

export default function HabitHoldButton({ habit, completed, disabled, onComplete }) {
  const [saving, setSaving] = useState(false)
  const lock = useRef(false)
  const rgb = habit.colour.slice(1).match(/.{2}/g).map((value) => parseInt(value, 16) / 255)
  const luminance = rgb.reduce((sum, value, index) => sum + [0.2126, 0.7152, 0.0722][index] * (value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4), 0)
  const commit = async (value) => {
    if (disabled || lock.current) return
    lock.current = true; setSaving(true)
    try { await onComplete(value) }
    finally { lock.current = false; setSaving(false) }
  }
  return <HoldButton completed={completed} disabled={disabled || saving} className="habit-hold-button"
    backgroundColor="#141414" fillColor={habit.colour} textColor="#f3f3f1"
    fillTextColor={luminance > 0.179 ? '#080808' : '#f3f3f1'} radius={14} size="lg"
    holdTime={900} releaseTime={200} resetAfter={0} wave glow
    icon={<Icon name={habit.icon} size={21} />} doneIcon={<Icon name="check" size={21} />}
    doneLabel={saving ? 'Saving…' : 'Completed'} ariaLabel={`${completed ? 'Undo' : 'Complete'} ${habit.name}`}
    onHold={() => commit(true)} onTap={() => { if (completed) return commit(false) }}>
    Hold to complete
  </HoldButton>
}
