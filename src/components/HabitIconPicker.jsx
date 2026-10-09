import { useEffect, useId, useRef, useState } from 'react'
import Icon from './Icon.jsx'
import { HABIT_ICON_CATALOG, HABIT_ICON_CATEGORIES, findHabitIcons } from '../services/habitIcons.js'

export default function HabitIconPicker({ value, colour, disabled, onChange }) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('')
  const search = useRef(null)
  const trigger = useRef(null)
  const id = useId()
  const selected = HABIT_ICON_CATALOG.find((icon) => icon.id === value)
  const results = findHabitIcons(query, category)
  useEffect(() => { if (open) search.current?.focus() }, [open])

  const choose = (icon) => {
    onChange(icon.id)
    setOpen(false)
    trigger.current?.focus()
  }

  return <div className="habit-icon-picker" style={{ '--picker-colour': colour }}>
    <span className="habit-icon-field-label" id={`${id}-label`}>Icon</span>
    <button ref={trigger} type="button" className="habit-icon-trigger" disabled={disabled}
      aria-labelledby={`${id}-label ${id}-selected`} aria-expanded={open} aria-controls={`${id}-panel`}
      onClick={() => setOpen((current) => !current)}>
      <span className="habit-icon-preview" style={{ '--preview-colour': colour }}><Icon name={value} size={24} /></span>
      <span id={`${id}-selected`}>{selected?.label || 'Checkmark'}<small>{open ? 'Close picker' : 'Choose icon'}</small></span>
      <span aria-hidden="true">{open ? '−' : '+'}</span>
    </button>
    {open && <section id={`${id}-panel`} className="habit-icon-panel" aria-label="Choose a habit icon"
      onKeyDown={(event) => { if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); setOpen(false); trigger.current?.focus() } }}>
      <div className="habit-icon-search"><label htmlFor={`${id}-search`}>Search icons</label>
        <input ref={search} id={`${id}-search`} type="search" value={query} disabled={disabled}
          onChange={(event) => setQuery(event.target.value)} placeholder="Try reading, walking, sleep…"
          onKeyDown={(event) => { if (event.key === 'Enter') event.preventDefault(); if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); setOpen(false); trigger.current?.focus() } }} />
      </div>
      <div className="habit-icon-filters" role="group" aria-label="Icon categories">
        {['', ...HABIT_ICON_CATEGORIES].map((item) => <button key={item || 'all'} type="button" disabled={disabled}
          aria-pressed={category === item} onClick={() => setCategory(item)}>{item || 'All'}</button>)}
      </div>
      <p className="habit-icon-result-count" role="status">{results.length} {results.length === 1 ? 'icon' : 'icons'}{query || category ? ' found' : ' to choose from'}</p>
      <div className="habit-icon-grid" role="group" aria-label="Available icons">
        {results.map((icon) => <button key={icon.id} type="button" className="habit-icon-option" disabled={disabled}
          aria-label={`Choose ${icon.label}`} aria-pressed={icon.id === value} onClick={() => choose(icon)}>
          <Icon name={icon.id} size={25} /><span>{icon.label}</span>{icon.id === value && <span className="habit-icon-selected" aria-hidden="true">✓</span>}
        </button>)}
      </div>
      {!results.length && <div className="habit-icon-empty"><p>No icons match your search.</p><button type="button" className="text-button" onClick={() => { setQuery(''); setCategory(''); search.current?.focus() }}>Show all icons</button></div>}
    </section>}
  </div>
}
