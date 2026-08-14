import { useEffect, useMemo, useState } from 'react'
import Dock from './components/Dock.jsx'
import Icon from './components/Icon.jsx'
import {
  dumbbellWeights,
  equipment,
  scheduledWorkout,
  workoutItems,
  workouts,
} from './data/workouts.js'

const HISTORY_KEY = 'aether-workout-history'
const DRAFT_KEY = 'aether-workout-drafts'

const readStorage = (key, fallback) => {
  try {
    const value = localStorage.getItem(key)
    return value ? JSON.parse(value) : fallback
  } catch {
    return fallback
  }
}

const formatDate = (value, options = {}) => new Intl.DateTimeFormat('en-IE', options).format(new Date(value))

const blankDraft = () => ({ startedAt: null, entries: {}, note: '' })

function App() {
  const scheduled = useMemo(() => scheduledWorkout(), [])
  const [page, setPage] = useState('today')
  const [selectedId, setSelectedId] = useState(scheduled.id)
  const [drafts, setDrafts] = useState(() => readStorage(DRAFT_KEY, {}))
  const [history, setHistory] = useState(() => readStorage(HISTORY_KEY, []))

  useEffect(() => localStorage.setItem(DRAFT_KEY, JSON.stringify(drafts)), [drafts])
  useEffect(() => localStorage.setItem(HISTORY_KEY, JSON.stringify(history)), [history])

  const selectedWorkout = workouts.find((workout) => workout.id === selectedId) ?? scheduled
  const draft = drafts[selectedWorkout.id] ?? blankDraft()

  const updateDraft = (updater) => {
    setDrafts((current) => ({
      ...current,
      [selectedWorkout.id]: typeof updater === 'function' ? updater(current[selectedWorkout.id] ?? blankDraft()) : updater,
    }))
  }

  const chooseWorkout = (id) => {
    setSelectedId(id)
    setPage('today')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const finishWorkout = () => {
    const items = workoutItems(selectedWorkout)
    const completed = items.filter((item) => draft.entries[item.id]?.done)
    const finishedAt = new Date().toISOString()
    const durationMinutes = draft.startedAt
      ? Math.max(1, Math.round((new Date(finishedAt) - new Date(draft.startedAt)) / 60000))
      : selectedWorkout.duration

    setHistory((current) => [{
      id: `${selectedWorkout.id}-${Date.now()}`,
      workoutId: selectedWorkout.id,
      title: selectedWorkout.title,
      day: selectedWorkout.day,
      finishedAt,
      durationMinutes,
      completed: completed.length,
      total: items.length,
      entries: draft.entries,
      note: draft.note.trim(),
    }, ...current])

    setDrafts((current) => {
      const next = { ...current }
      delete next[selectedWorkout.id]
      return next
    })
    setPage('history')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="app-shell">
      <div className="ambient" aria-hidden="true">
        <span className="ambient-orbit ambient-orbit-one" />
        <span className="ambient-orbit ambient-orbit-two" />
        <span className="ambient-grain" />
      </div>

      {page === 'today' && (
        <TodayPage
          workout={selectedWorkout}
          draft={draft}
          updateDraft={updateDraft}
          onFinish={finishWorkout}
          onViewPlan={() => setPage('plan')}
        />
      )}
      {page === 'plan' && <PlanPage selectedId={selectedId} onChoose={chooseWorkout} />}
      {page === 'history' && <HistoryPage history={history} onTrain={() => setPage('today')} />}

      <Dock page={page} onChange={setPage} />
    </div>
  )
}

function Brand() {
  return (
    <header className="brand">
      <span className="brand-mark" aria-hidden="true">A</span>
      <span>Aether</span>
    </header>
  )
}

function TodayPage({ workout, draft, updateDraft, onFinish, onViewPlan }) {
  const [now, setNow] = useState(Date.now())
  const items = workoutItems(workout)
  const completeCount = items.filter((item) => draft.entries[item.id]?.done).length
  const progress = Math.round((completeCount / items.length) * 100)
  const todayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][new Date().getDay()]

  useEffect(() => {
    if (!draft.startedAt) return undefined
    const timer = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [draft.startedAt])

  const elapsed = draft.startedAt ? Math.max(0, Math.floor((now - new Date(draft.startedAt).getTime()) / 1000)) : 0
  const elapsedLabel = `${String(Math.floor(elapsed / 60)).padStart(2, '0')}:${String(elapsed % 60).padStart(2, '0')}`
  const dateLabel = formatDate(Date.now(), { weekday: 'long', day: 'numeric', month: 'long' })

  const updateEntry = (id, patch) => {
    updateDraft((current) => ({
      ...current,
      entries: {
        ...current.entries,
        [id]: { ...current.entries[id], ...patch },
      },
    }))
  }

  return (
    <main className="page today-page">
      <Brand />
      <section className="hero">
        <p className="eyebrow">{dateLabel}</p>
        <h1>{workout.day === todayName ? 'Today’s work.' : workout.shortDay + '’s work.'}</h1>
        <p className="hero-copy">One hour. Good form. Leave enough in the tank to come back.</p>
      </section>

      <section className="workout-card">
        <header className="workout-heading">
          <div>
            <div className="workout-meta">
              <span>{workout.day}</span>
              <span>{workout.duration} min</span>
              <span>{workout.accent}</span>
            </div>
            <h2>{workout.title}</h2>
            <p>{workout.focus}</p>
          </div>
          <div className="progress-ring" style={{ '--progress': `${progress * 3.6}deg` }} aria-label={`${progress}% complete`}>
            <span>{progress}%</span>
          </div>
        </header>

        {!draft.startedAt ? (
          <div className="start-panel">
            <div>
              <Icon name="timer" size={22} />
              <p><strong>Ready when you are.</strong><span>Your progress saves on this device.</span></p>
            </div>
            <button className="primary-button" type="button" onClick={() => updateDraft((current) => ({ ...current, startedAt: new Date().toISOString() }))}>
              Begin workout <Icon name="arrow" size={18} />
            </button>
          </div>
        ) : (
          <div className="active-timer"><span>Session active</span><strong>{elapsedLabel}</strong></div>
        )}

        <div className="workout-blocks">
          {workout.blocks.map((block) => (
            <section className="workout-block" key={block.title}>
              <header className="block-heading">
                <div><span>{block.range}</span><h3>{block.title}</h3></div>
                {block.note && <p>{block.note}</p>}
              </header>
              <div className="exercise-list">
                {block.items.map((item) => {
                  const entry = draft.entries[item.id] ?? {}
                  return (
                    <article className={`exercise-row ${entry.done ? 'is-done' : ''}`} key={item.id}>
                      <button
                        className="check-button"
                        type="button"
                        aria-label={`${entry.done ? 'Mark incomplete' : 'Mark complete'}: ${item.name}`}
                        aria-pressed={Boolean(entry.done)}
                        onClick={() => updateEntry(item.id, { done: !entry.done })}
                      >
                        {entry.done && <Icon name="check" size={17} />}
                      </button>
                      <div className="exercise-main">
                        <strong>{item.name}</strong>
                        <span>{item.detail ?? item.target}</span>
                      </div>
                      <span className="exercise-target">{item.target}</span>
                      <div className="exercise-inputs">
                        {item.kind === 'weight' && (
                          <label>
                            <span>Load</span>
                            <select value={entry.weight ?? ''} onChange={(event) => updateEntry(item.id, { weight: event.target.value })}>
                              <option value="">— kg</option>
                              {dumbbellWeights.map((weight) => <option key={weight} value={weight}>{weight} kg</option>)}
                            </select>
                          </label>
                        )}
                        <label>
                          <span>{item.kind === 'cardio' ? 'Pace / result' : item.kind === 'time' ? 'Time' : 'Reps'}</span>
                          <input
                            value={entry.result ?? ''}
                            onChange={(event) => updateEntry(item.id, { result: event.target.value })}
                            placeholder={item.kind === 'cardio' ? 'Optional' : 'e.g. 10, 10, 9'}
                          />
                        </label>
                      </div>
                    </article>
                  )
                })}
              </div>
            </section>
          ))}
        </div>

        <label className="session-note">
          <span>Session note</span>
          <textarea
            rows="3"
            value={draft.note}
            onChange={(event) => updateDraft((current) => ({ ...current, note: event.target.value }))}
            placeholder="Energy, technique, or what to adjust next time…"
          />
        </label>

        <footer className="workout-footer">
          <p>{completeCount} of {items.length} movements complete</p>
          <button className="primary-button" type="button" onClick={onFinish} disabled={!draft.startedAt || completeCount === 0}>
            Finish session <Icon name="check" size={18} />
          </button>
        </footer>
      </section>

      <button className="text-button" type="button" onClick={onViewPlan}>Browse the full weekly plan <Icon name="arrow" size={16} /></button>
    </main>
  )
}

function PlanPage({ selectedId, onChoose }) {
  return (
    <main className="page content-page">
      <Brand />
      <section className="content-hero">
        <p className="eyebrow">Three days · after work</p>
        <h1>The week.</h1>
        <p>Progressive strength and rowing, built around the equipment already at home.</p>
      </section>

      <section className="plan-grid">
        {workouts.map((workout, index) => (
          <button className={`plan-card ${selectedId === workout.id ? 'is-selected' : ''}`} type="button" key={workout.id} onClick={() => onChoose(workout.id)}>
            <span className="plan-index">0{index + 1}</span>
            <div><span>{workout.day} · {workout.duration} min</span><h2>{workout.title}</h2><p>{workout.focus}</p></div>
            <Icon name="arrow" size={20} />
          </button>
        ))}
      </section>

      <section className="equipment-section">
        <div className="section-title"><p className="eyebrow">Your setup</p><h2>Everything you need.</h2></div>
        <div className="equipment-grid">
          {equipment.map((item) => (
            <article key={item.name}><Icon name="dumbbell" size={21} /><div><strong>{item.name}</strong><span>{item.detail}</span></div></article>
          ))}
        </div>
      </section>

      <aside className="rule-card"><span>Consistency rule</span><p>The scheduled hour is the commitment. Lower the load or pace on a low-energy day, but keep the appointment.</p></aside>
    </main>
  )
}

function HistoryPage({ history, onTrain }) {
  const totalMinutes = history.reduce((total, item) => total + item.durationMinutes, 0)
  const thisMonth = history.filter((item) => {
    const date = new Date(item.finishedAt)
    const now = new Date()
    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()
  }).length

  return (
    <main className="page content-page">
      <Brand />
      <section className="content-hero history-hero">
        <div><p className="eyebrow">Training record</p><h1>Work done.</h1><p>Small sessions, repeated. That’s the whole idea.</p></div>
        <div className="history-stats"><div><strong>{history.length}</strong><span>Sessions</span></div><div><strong>{totalMinutes}</strong><span>Minutes</span></div><div><strong>{thisMonth}</strong><span>This month</span></div></div>
      </section>

      {history.length === 0 ? (
        <section className="empty-state"><span>00</span><h2>No sessions logged yet.</h2><p>Finish your first workout and it’ll show up here.</p><button className="primary-button" type="button" onClick={onTrain}>Start training <Icon name="arrow" size={18} /></button></section>
      ) : (
        <section className="history-list">
          {history.map((entry) => (
            <article className="history-card" key={entry.id}>
              <time dateTime={entry.finishedAt}><strong>{formatDate(entry.finishedAt, { day: '2-digit' })}</strong><span>{formatDate(entry.finishedAt, { month: 'short' })}</span></time>
              <div className="history-card-main"><span>{entry.day}</span><h2>{entry.title}</h2>{entry.note && <p>“{entry.note}”</p>}</div>
              <div className="history-card-result"><strong>{entry.completed}/{entry.total}</strong><span>{entry.durationMinutes} min</span></div>
            </article>
          ))}
        </section>
      )}
    </main>
  )
}

export default App
