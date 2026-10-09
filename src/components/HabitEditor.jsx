import { useState } from 'react'
import { HABIT_COLOURS, WEEKDAYS } from '../services/habits.js'
import HabitIconPicker from './HabitIconPicker.jsx'

export default function HabitEditor({ habit, categories, groups, today, busy, onSave, onClose }) {
  const [draft, setDraft] = useState(() => ({ name: habit?.name || '', description: habit?.description || '',
    icon: habit?.icon || 'check', colour: habit?.colour || HABIT_COLOURS[0], days: habit?.days || [0, 1, 2, 3, 4, 5, 6],
    category: habit?.category || categories.find((item) => item.id === habit?.category_id)?.name || '',
    group: habit?.group || groups.find((item) => item.id === habit?.group_id)?.name || '', start_date: habit?.start_date || today }))
  const [error, setError] = useState('')
  const change = (key, value) => setDraft((current) => ({ ...current, [key]: value }))
  return (
    <form className="habit-editor" onSubmit={async (event) => {
      event.preventDefault(); setError('')
      if (busy) return
      if (!draft.name.trim() || !draft.days.length) { setError('Add a name and select at least one day.'); return }
      try { await onSave({ ...draft, name: draft.name.trim(), description: draft.description.trim() }); onClose() }
      catch (failure) { setError(failure.message) }
    }}>
      <div className="habit-editor-heading"><h2>{habit?.id ? 'Edit habit.' : 'Make it a habit.'}</h2><button type="button" className="text-button" onClick={onClose} disabled={busy}>Close</button></div>
      <label>Name<input autoFocus required maxLength={120} value={draft.name} onChange={(event) => change('name', event.target.value)} /></label>
      <label>Description<textarea rows={2} maxLength={1000} value={draft.description} onChange={(event) => change('description', event.target.value)} /></label>
      <HabitIconPicker value={draft.icon} colour={draft.colour} disabled={busy} onChange={(icon) => change('icon', icon)} />
      <div className="habit-form-row">
        <label>Colour<input type="color" value={draft.colour} onChange={(event) => change('colour', event.target.value)} /></label></div>
      <div className="habit-colours">{HABIT_COLOURS.map((colour) => <button type="button" key={colour} aria-label={`Use ${colour}`} aria-pressed={draft.colour === colour} style={{ background: colour }} onClick={() => change('colour', colour)} />)}</div>
      <fieldset><legend>Scheduled days</legend><div className="habit-weekdays">{WEEKDAYS.map((day, index) => <label key={day}><input type="checkbox" checked={draft.days.includes(index)} onChange={(event) => change('days', event.target.checked ? [...draft.days, index].sort() : draft.days.filter((value) => value !== index))} />{day.slice(0, 3)}</label>)}</div></fieldset>
      <div className="habit-form-row"><label>Category<input list="habit-category-names" maxLength={60} placeholder="Uncategorised" value={draft.category} onChange={(event) => change('category', event.target.value)} /></label>
        <label>Group<input list="habit-group-names" maxLength={60} placeholder="Anytime" value={draft.group} onChange={(event) => change('group', event.target.value)} /></label></div>
      <datalist id="habit-category-names">{categories.map((item) => <option key={item.id} value={item.name} />)}</datalist>
      <datalist id="habit-group-names">{groups.map((item) => <option key={item.id} value={item.name} />)}</datalist>
      <p className="habit-help">New category and group names are created when you save.</p>
      {!habit?.id && <label>Start date<input type="date" required min={today} value={draft.start_date} onChange={(event) => change('start_date', event.target.value)} /></label>}
      {habit?.id && <p className="habit-help">Schedule changes apply from tomorrow. Earlier results stay intact.</p>}
      {error && <p role="alert" className="habit-error">{error}</p>}
      <button className="primary-button" disabled={busy} type="submit">{busy ? 'Saving…' : habit?.id ? 'Save changes' : 'Create habit'}</button>
    </form>
  )
}
