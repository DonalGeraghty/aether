import { useEffect, useRef, useState } from 'react'
import Brand from '../components/Brand.jsx'
import HabitHoldButton from '../components/HabitHoldButton.jsx'
import HabitEditor from '../components/HabitEditor.jsx'
import HabitDialog from '../components/HabitDialog.jsx'
import Icon from '../components/Icon.jsx'
import { habitRequest } from '../services/habitApi.js'
import { calendarDates, checkinKey, dateInTimezone, isDue, monthShift, WEEKDAYS } from '../services/habits.js'

function Filters({ state, filter, onChange }) {
  return <div className="habit-filters"><label>Category<select value={filter.category} onChange={(event) => onChange({ ...filter, category: event.target.value })}><option value="">All categories</option><option value="none">Uncategorised</option>{state.categories.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
    <label>Group<select value={filter.group} onChange={(event) => onChange({ ...filter, group: event.target.value })}><option value="">All groups</option><option value="none">Anytime</option>{state.groups.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label></div>
}

const matches = (habit, filter) => (!filter.category || (filter.category === 'none' ? !habit.category_id : habit.category_id === filter.category)) && (!filter.group || (filter.group === 'none' ? !habit.group_id : habit.group_id === filter.group))

function LabelsManager({ type, items, busy, mutate }) {
  const [name, setName] = useState('')
  const [editing, setEditing] = useState(null)
  const [error, setError] = useState('')
  const run = async (action) => { setError(''); try { await action() } catch (failure) { setError(failure.message) } }
  return <section className="habit-label-manager"><h2>{type === 'categories' ? 'Categories' : 'Groups'}</h2>
    <form onSubmit={(event) => { event.preventDefault(); run(async () => { await mutate(`/api/habit-${type}`, 'POST', { name: name.trim() }); setName('') }) }}>
      <label className="sr-only" htmlFor={`new-${type}`}>New {type === 'categories' ? 'category' : 'group'}</label><input id={`new-${type}`} required maxLength={60} placeholder={`New ${type === 'categories' ? 'category' : 'group'}`} value={name} onChange={(event) => setName(event.target.value)} /><button type="submit" className="text-button" disabled={busy}>Add</button>
    </form>
    {items.map((item, index) => <div className="habit-label-row" key={item.id}>
      {editing?.id === item.id ? <form onSubmit={(event) => { event.preventDefault(); run(async () => { await mutate(`/api/habit-${type}/${item.id}`, 'PUT', { name: editing.name }); setEditing(null) }) }}><input aria-label={`Rename ${item.name}`} required maxLength={60} value={editing.name} onChange={(event) => setEditing({ ...editing, name: event.target.value })} /><button className="text-button" disabled={busy}>Save</button><button className="text-button" type="button" onClick={() => setEditing(null)}>Cancel</button></form> : <><span>{item.name}</span><button type="button" className="text-button" disabled={busy} onClick={() => setEditing(item)}>Rename</button></>}
      <button type="button" className="text-button" disabled={busy || index === 0} aria-label={`Move ${item.name} up`} onClick={() => run(() => mutate(`/api/habit-${type}/${item.id}`, 'PUT', { order: index - 1 }))}>↑</button>
      <button type="button" className="text-button" disabled={busy || index === items.length - 1} aria-label={`Move ${item.name} down`} onClick={() => run(() => mutate(`/api/habit-${type}/${item.id}`, 'PUT', { order: index + 1 }))}>↓</button>
      <button type="button" className="text-button" disabled={busy} onClick={() => { if (window.confirm(`Remove ${item.name}? Its habits will become ${type === 'categories' ? 'uncategorised' : 'ungrouped'}.`)) run(() => mutate(`/api/habit-${type}/${item.id}`, 'DELETE')) }}>Remove</button>
    </div>)}{error && <p className="habit-error" role="alert">{error}</p>}
  </section>
}

function CheckinNote({ habit, date, checkin, busy, save }) {
  const [note, setNote] = useState(checkin?.note || '')
  const [message, setMessage] = useState('')
  return <form className="habit-note" onSubmit={async (event) => { event.preventDefault(); setMessage(''); try { await save(habit, date, checkin?.completed || false, note); setMessage('Note saved.') } catch (failure) { setMessage(failure.message) } }}>
    <label>Optional note<textarea rows={2} maxLength={1000} value={note} onChange={(event) => setNote(event.target.value)} placeholder="What helped, or got in the way?" /></label><button type="submit" className="text-button" disabled={busy}>Save note</button><span role="status">{message}</span>
  </form>
}

export default function HabitTracker({ page, store, onPage, demo, onUnauthorized }) {
  const { state, checkins, loading, busy: storeBusy, mutate, loadRange, retry } = store
  const [savingHabit, setSavingHabit] = useState(false)
  const busy = storeBusy || savingHabit
  const [clock, setClock] = useState(() => new Date())
  useEffect(() => { const timer = setInterval(() => setClock(new Date()), 30000); return () => clearInterval(timer) }, [])
  const today = dateInTimezone(state.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC', clock)
  const [month, setMonth] = useState(today.slice(0, 7))
  const [selectedDate, setSelectedDate] = useState(today)
  const [selectedHabit, setSelectedHabit] = useState('')
  const [filter, setFilter] = useState({ category: '', group: '' })
  const [editor, setEditor] = useState(null)
  const [showArchived, setShowArchived] = useState(false)
  const [expanded, setExpanded] = useState('')
  const [message, setMessage] = useState('')
  const [drafts, setDrafts] = useState([])
  const [draftSummary, setDraftSummary] = useState('')
  const [aiBusy, setAiBusy] = useState(false)
  const [aiError, setAiError] = useState('')
  const [calendarLoading, setCalendarLoading] = useState(false)
  const [calendarError, setCalendarError] = useState('')
  const [notice, setNotice] = useState('')
  const dates = calendarDates(month)
  const rangeStart = dates[0], rangeEnd = dates[41]
  const previousDay = useRef(today)

  useEffect(() => {
    if (!loading && previousDay.current !== today) {
      previousDay.current = today
      retry()
    }
  }, [today, loading, retry])

  useEffect(() => {
    if (loading) return undefined
    let active = true
    setCalendarLoading(true); setCalendarError('')
    loadRange(rangeStart, rangeEnd).catch((failure) => { if (active) setCalendarError(failure.message) }).finally(() => { if (active) setCalendarLoading(false) })
    return () => { active = false }
  }, [loadRange, loading, rangeStart, rangeEnd])

  const run = async (action) => { setNotice(''); try { await action() } catch (failure) { setNotice(failure.message) } }
  const saveCheckin = (habit, date, completed, note = checkins[checkinKey(habit.id, date)]?.note || '') => mutate(`/api/habits/${habit.id}/checkins/${date}`, 'PUT', { completed, note })
  const saveHabit = async (draft) => {
    setSavingHabit(true)
    try {
    const { category, group, ...fields } = draft
    // Resolve labels sequentially so shared mutations cannot race.
    const resolve = async (name, type) => {
      if (!name.trim()) return null
      const existing = state[type].find((item) => item.name.toLowerCase() === name.trim().toLowerCase())
      if (existing) return existing.id
      return (await mutate(`/api/habit-${type}`, 'POST', { name: name.trim() })).item.id
    }
    const category_id = await resolve(category, 'categories')
    const group_id = await resolve(group, 'groups')
    if (editor?.id) delete fields.start_date
    const result = await mutate(editor?.id ? `/api/habits/${editor.id}` : '/api/habits', editor?.id ? 'PUT' : 'POST', { ...fields, category_id, group_id })
    if (editor?.draftIndex !== undefined) setDrafts((current) => current.filter((_, index) => index !== editor.draftIndex))
    return result
    } finally { setSavingHabit(false) }
  }

  const filtered = state.habits.filter((habit) => matches(habit, filter))
  const due = filtered.filter((habit) => isDue(habit, today))
  const completeCount = due.filter((habit) => checkins[checkinKey(habit.id, today)]?.completed).length
  const groups = [...state.groups, { id: null, name: 'Anytime' }]
  const viewHabitHistory = (habit) => {
    setSelectedHabit(habit.id); setMonth(today.slice(0, 7)); setSelectedDate(today); onPage('calendar')
  }
  const closeHabitMenu = (event) => {
    const menu = event.currentTarget.closest('details')
    if (menu) { menu.open = false; menu.querySelector('summary')?.focus() }
  }

  return <main className={`page habit-page${page === 'today' ? ' habit-today-page' : ''}`}><Brand onPlan={() => onPage('today')} />
    <section className="content-hero habit-hero"><p className="eyebrow">{page === 'today' ? new Date(`${today}T12:00:00Z`).toLocaleDateString('en-IE', { weekday: 'long', month: 'long', day: 'numeric', timeZone: 'UTC' }) : page === 'assistant' ? 'Intentions into routines' : 'Small actions · steady progress'}</p>
      <h1>{page === 'today' ? 'One day at a time.' : page === 'habits' ? 'Your habits.' : page === 'calendar' ? 'The bigger picture.' : 'Make room for good.'}</h1>
      <p>{page === 'today' ? 'A little each day. Hold a button to mark it done.' : page === 'habits' ? 'Build routines that fit your life. Arrange them your way.' : page === 'calendar' ? 'See what you did, and where to begin again.' : 'Describe a routine or a goal. Review the habits before adding them.'}</p>
    </section>
    {notice && <p className="habit-error" role="alert">{notice}</p>}
    {loading ? <section className="empty-state" role="status"><h2>Loading your habits.</h2></section> : <>
      {page === 'today' && <><div className="habit-toolbar"><span className="eyebrow" role="status">{completeCount} / {due.length} complete</span><button type="button" className="primary-button" onClick={() => setEditor({})}>New habit <Icon name="arrow" size={18} /></button></div>
        <div className="habit-today-desktop-filters"><Filters state={state} filter={filter} onChange={setFilter} /></div>
        <details className="habit-today-mobile-filters"><summary>Filters <span>{filter.category || filter.group ? `${Number(Boolean(filter.category)) + Number(Boolean(filter.group))} active` : 'All habits'}</span></summary><Filters state={state} filter={filter} onChange={setFilter} /></details>
        {!due.length && <section className="empty-state"><h2>{state.habits.length ? 'Nothing scheduled here today.' : 'Start with something small.'}</h2><p>{state.habits.length ? 'Change your filters or enjoy your day off.' : 'Create a habit yourself, or ask Aether to help.'}</p><button className="text-button" type="button" onClick={() => onPage('assistant')}>Create with AI →</button></section>}
        {groups.map((group) => { const habits = due.filter((habit) => habit.group_id === group.id); return habits.length > 0 && <section className="habit-group" key={group.id || 'anytime'}><div className="section-title"><h2>{group.name}</h2><span className="eyebrow">{habits.length} habits</span></div><div className="habit-grid">{habits.map((habit) => {
          const entry = checkins[checkinKey(habit.id, today)], stats = state.stats[habit.id] || {}
          return <article key={habit.id} className={`habit-tile${entry?.completed ? ' is-complete' : ''}`}>
            <HabitHoldButton habit={habit} completed={Boolean(entry?.completed)} disabled={busy} onComplete={(completed) => saveCheckin(habit, today, completed)} />
            <div className="habit-tile-info"><h3>{habit.name}</h3><p>{stats.current || 0} streak<span className="habit-tile-status"> · {entry?.completed ? 'Done today' : 'Not yet'}</span></p></div>
            <div className="habit-tile-actions"><button type="button" className="text-button" onClick={() => viewHabitHistory(habit)}>View history</button><button className="text-button" type="button" onClick={() => setExpanded(expanded === habit.id ? '' : habit.id)}>Note</button></div>
            <details className="habit-mobile-menu" name="today-habit-actions"
              onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) event.currentTarget.open = false }}
              onKeyDown={(event) => { if (event.key === 'Escape') { event.preventDefault(); event.currentTarget.open = false; event.currentTarget.querySelector('summary')?.focus() } }}>
              <summary aria-label={`More actions for ${habit.name}`}><span aria-hidden="true">⋯</span></summary>
              <div className="habit-mobile-menu-items"><button type="button" onClick={(event) => { closeHabitMenu(event); viewHabitHistory(habit) }}>View history</button><button type="button" onClick={(event) => { closeHabitMenu(event); setExpanded(expanded === habit.id ? '' : habit.id) }}>{expanded === habit.id ? 'Close note' : 'Add a note'}</button></div>
            </details>
            {expanded === habit.id && <CheckinNote key={`${habit.id}-${entry?.note || ''}`} habit={habit} date={today} checkin={entry} busy={busy} save={saveCheckin} />}
          </article>
        })}</div></section> })}
        <p className="habit-help">Days follow {state.timezone}. Unscheduled days do not break your streak. Keyboard: focus a button, then hold Enter or Space. Select a completed button to undo.</p>
      </>}
      {page === 'habits' && <><div className="habit-toolbar"><button type="button" className="primary-button" onClick={() => setEditor({})}>New habit</button><label className="habit-archive-toggle"><input type="checkbox" checked={showArchived} onChange={(event) => setShowArchived(event.target.checked)} /> Include archived</label></div><Filters state={state} filter={filter} onChange={setFilter} />
        <section className="habit-management-list">{filtered.filter((habit) => showArchived || !habit.archived).map((habit, index, visible) => <article className="habit-management-row" key={habit.id}><span className="habit-management-icon" style={{ color: habit.colour }}><Icon name={habit.icon} size={24} /></span><div><h2>{habit.name}{habit.archived && <small>Archived</small>}</h2><p>{habit.days.length === 7 ? 'Every day' : habit.days.map((day) => WEEKDAYS[day].slice(0, 3)).join(' · ')} · {state.categories.find((item) => item.id === habit.category_id)?.name || 'Uncategorised'} · {state.groups.find((item) => item.id === habit.group_id)?.name || 'Anytime'}</p>{habit.description && <p>{habit.description}</p>}</div><div className="habit-row-actions"><button className="text-button" type="button" disabled={busy} onClick={() => setEditor(habit)}>Edit</button><button type="button" className="text-button" disabled={busy || index === 0} aria-label={`Move ${habit.name} up`} onClick={() => run(() => mutate(`/api/habits/${habit.id}`, 'PUT', { order: state.habits.findIndex((item) => item.id === visible[index - 1].id) }))}>↑</button><button type="button" className="text-button" disabled={busy || index === visible.length - 1} aria-label={`Move ${habit.name} down`} onClick={() => run(() => mutate(`/api/habits/${habit.id}`, 'PUT', { order: state.habits.findIndex((item) => item.id === visible[index + 1].id) }))}>↓</button><button type="button" className="text-button" disabled={busy} onClick={() => run(() => mutate(`/api/habits/${habit.id}`, 'PUT', { archived: !habit.archived }))}>{habit.archived ? 'Restore' : 'Archive'}</button><button type="button" className="text-button" disabled={busy} onClick={() => { if (window.confirm(`Permanently delete ${habit.name} and all its check-ins? This cannot be undone.`)) run(() => mutate(`/api/habits/${habit.id}`, 'DELETE')) }}>Delete</button></div></article>)}</section>
        {!filtered.length && <p className="habit-help">No habits yet. Create one to get started.</p>}<div className="habit-organisation"><LabelsManager type="categories" items={state.categories} busy={busy} mutate={mutate} /><LabelsManager type="groups" items={state.groups} busy={busy} mutate={mutate} /></div>
      </>}
      {page === 'calendar' && <><Filters state={state} filter={filter} onChange={setFilter} /><label className="habit-calendar-picker">Habit<select value={selectedHabit} onChange={(event) => setSelectedHabit(event.target.value)}><option value="">All habits</option>{filtered.map((habit) => <option value={habit.id} key={habit.id}>{habit.name}</option>)}</select></label>
        {selectedHabit && state.habits.some((habit) => habit.id === selectedHabit) && <div className="habit-stats">{[['Current streak', state.stats[selectedHabit]?.current || 0], ['Best streak', state.stats[selectedHabit]?.best || 0], ['Last 30 days', `${state.stats[selectedHabit]?.rate || 0}%`]].map(([label, value]) => <div key={label}><span>{label}</span><strong>{value}</strong></div>)}</div>}
        <div className="habit-calendar-layout"><section className="habit-calendar"><div className="habit-calendar-heading"><button type="button" className="text-button" aria-label="Previous month" onClick={() => { const next = monthShift(month, -1); setMonth(next); setSelectedDate(`${next}-01`) }}>←</button><h2>{new Date(`${month}-01T12:00:00Z`).toLocaleDateString('en-IE', { month: 'long', year: 'numeric', timeZone: 'UTC' })}</h2><button className="text-button" type="button" aria-label="Next month" onClick={() => { const next = monthShift(month, 1); setMonth(next); setSelectedDate(`${next}-01`) }}>→</button></div>
          <div className="habit-calendar-grid">{WEEKDAYS.map((day) => <span className="habit-calendar-weekday" key={day}>{day.slice(0, 1)}</span>)}{dates.map((date) => {
            const habits = filtered.filter((habit) => (!selectedHabit || habit.id === selectedHabit) && isDue(habit, date)), complete = habits.filter((habit) => checkins[checkinKey(habit.id, date)]?.completed).length
            const status = calendarLoading || calendarError ? 'Loading' : !habits.length ? 'Unscheduled' : complete === habits.length ? 'Complete' : date < today ? (complete ? 'Partial' : 'Missed') : date === today ? 'Pending' : 'Upcoming'
            return <button type="button" key={date} aria-label={`${date}, ${status}${habits.length ? `, ${complete} of ${habits.length} complete` : ''}`} aria-pressed={selectedDate === date} className={`habit-calendar-day ${date.slice(0, 7) !== month ? 'is-outside' : ''} ${date === today ? 'is-today' : ''} ${status === 'Complete' ? 'is-done' : ''}`} onClick={() => setSelectedDate(date)}><span>{Number(date.slice(8))}</span><small>{calendarLoading || calendarError ? '—' : habits.length ? `${complete}/${habits.length}` : '·'}</small></button>
          })}</div><p className="habit-help">{calendarLoading ? 'Loading check-ins…' : calendarError || 'Completed / scheduled · Select a day to see details.'}</p></section>
          <section className="habit-day-detail"><p className="eyebrow">{selectedDate}</p><h2>{selectedDate > today ? 'Coming up.' : selectedDate === today ? 'Today’s record.' : 'Your record.'}</h2>
            {!calendarLoading && !calendarError && <>{filtered.filter((habit) => (!selectedHabit || habit.id === selectedHabit) && (isDue(habit, selectedDate) || checkins[checkinKey(habit.id, selectedDate)])).map((habit) => {
              const entry = checkins[checkinKey(habit.id, selectedDate)], dueOnDate = isDue(habit, selectedDate)
              return <article key={habit.id} className="habit-day-row"><div><span style={{ color: habit.colour }}><Icon name={entry?.completed ? 'check' : habit.icon} size={20} /></span><h3>{habit.name}</h3><span>{entry?.completed ? 'Complete' : !dueOnDate ? 'Unscheduled' : selectedDate < today ? 'Missed' : selectedDate === today ? 'Pending' : 'Upcoming'}</span></div>{selectedDate <= today && <><button type="button" className="text-button" disabled={busy || (!dueOnDate && !entry?.completed)} onClick={() => run(() => saveCheckin(habit, selectedDate, !entry?.completed))}>{entry?.completed ? 'Undo completion' : 'Mark complete'}</button><CheckinNote key={`${habit.id}-${selectedDate}-${entry?.note || ''}`} habit={habit} date={selectedDate} checkin={entry} busy={busy} save={saveCheckin} /></>}</article>
            })}{!filtered.some((habit) => (!selectedHabit || habit.id === selectedHabit) && isDue(habit, selectedDate)) && <p className="habit-help">No habits scheduled.</p>}</>}
          </section></div></>}
      {page === 'assistant' && <><form className="workout-log-composer" onSubmit={async (event) => {
        event.preventDefault(); if (aiBusy) return; setAiBusy(true); setAiError(''); setDrafts([]); setDraftSummary('')
        try {
          if (demo) throw new Error('AI drafting needs a signed-in account with a connected provider.')
          const result = await habitRequest('/api/habits/draft', 'POST', { message: message.trim() })
          setDrafts(result.draft.habits); setDraftSummary(result.draft.summary)
        } catch (failure) { setAiError(failure.message); if (failure.status === 401) onUnauthorized() }
        finally { setAiBusy(false) }
      }}><label htmlFor="habit-ai-message">What would you like to make a habit?</label><textarea id="habit-ai-message" required rows={5} maxLength={2000} value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Help me build an evening routine with reading, stretching, and preparing for tomorrow…" disabled={aiBusy} onKeyDown={(event) => { if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) { event.preventDefault(); event.currentTarget.form.requestSubmit() } }} /><div><span>Nothing is created until you confirm.</span><button type="submit" className="primary-button" disabled={aiBusy || !message.trim()}>{aiBusy ? 'Thinking…' : 'Draft habits'}<Icon name="arrow" size={18} /></button></div></form>
        {aiError && <div className="workout-log-error" role="alert"><p>{aiError}</p><button type="button" onClick={() => onPage('account')}>Open AI settings</button></div>}
        {draftSummary && <p className="habit-help" role="status">{draftSummary}</p>}
        <section className="habit-ai-drafts" aria-live="polite">{drafts.map((draft, index) => <article className="habit-ai-draft" key={`${draft.name}-${index}`}><span style={{ color: draft.colour }}><Icon name={draft.icon} size={24} /></span><h2>{draft.name}</h2><p>{draft.description}</p><p className="habit-help">{draft.days.map((day) => WEEKDAYS[day].slice(0, 3)).join(' · ')} · {draft.category || 'Uncategorised'} · {draft.group || 'Anytime'}</p>{state.habits.some((habit) => habit.name.toLowerCase() === draft.name.toLowerCase()) && <p className="habit-help">You already have a habit with this name.</p>}<div><button type="button" className="primary-button" disabled={busy} onClick={() => setEditor({ ...draft, draftIndex: index })}>Review & create</button><button className="text-button" type="button" onClick={() => setDrafts((current) => current.filter((_, position) => position !== index))}>Discard</button></div></article>)}</section>
      </>}
    </>}
    {editor && <HabitDialog label={editor.id ? 'Edit habit' : 'Create habit'} busy={busy} onClose={() => setEditor(null)}><HabitEditor key={editor.id || editor.draftIndex || 'new'} habit={editor} categories={state.categories} groups={state.groups} today={today} busy={busy} onSave={saveHabit} onClose={() => setEditor(null)} /></HabitDialog>}
  </main>
}
