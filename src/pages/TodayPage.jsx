import { useEffect, useState } from 'react'
import Brand from '../components/Brand.jsx'
import Icon from '../components/Icon.jsx'
import { dumbbellWeights, workoutItems } from '../data/workouts.js'
import { formatDate } from '../utils/date.js'

export default function TodayPage({
  workout,
  draft,
  updateDraft,
  onFinish,
  finishing,
  onViewPlan,
}) {
  const [now, setNow] = useState(() => Date.now())
  const items = workoutItems(workout)
  const completeCount = items.filter((item) => draft.entries[item.id]?.done).length
  const progress = Math.round((completeCount / items.length) * 100)
  const todayName = [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
  ][new Date(now).getDay()]

  useEffect(() => {
    if (!draft.startedAt) return undefined
    const timer = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [draft.startedAt])

  const elapsed = draft.startedAt
    ? Math.max(0, Math.floor((now - new Date(draft.startedAt).getTime()) / 1000))
    : 0
  const elapsedLabel = `${String(Math.floor(elapsed / 60)).padStart(2, '0')}:${String(elapsed % 60).padStart(2, '0')}`
  const dateLabel = formatDate(now, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })

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
      <Brand onPlan={onViewPlan} />
      <section className="hero">
        <p className="eyebrow">{dateLabel}</p>
        <h1>{workout.day === todayName ? 'Today’s work.' : `${workout.shortDay}’s work.`}</h1>
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
          <div
            className="progress-ring"
            style={{ '--progress': `${progress * 3.6}deg` }}
            aria-label={`${progress}% complete`}
          >
            <span>{progress}%</span>
          </div>
        </header>

        {!draft.startedAt ? (
          <div className="start-panel">
            <div>
              <Icon name="timer" size={22} />
              <p>
                <strong>Ready when you are.</strong>
                <span>Your progress saves on this device.</span>
              </p>
            </div>
            <button
              className="primary-button"
              type="button"
              onClick={() => updateDraft((current) => ({
                ...current,
                startedAt: new Date().toISOString(),
              }))}
            >
              Begin workout <Icon name="arrow" size={18} />
            </button>
          </div>
        ) : (
          <div className="active-timer">
            <span>Session active</span>
            <strong>{elapsedLabel}</strong>
          </div>
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
                            <select
                              value={entry.weight ?? ''}
                              onChange={(event) => updateEntry(item.id, { weight: event.target.value })}
                            >
                              <option value="">— kg</option>
                              {dumbbellWeights.map((weight) => (
                                <option key={weight} value={weight}>{weight} kg</option>
                              ))}
                            </select>
                          </label>
                        )}
                        <label>
                          <span>
                            {item.kind === 'cardio'
                              ? 'Pace / result'
                              : item.kind === 'time' ? 'Time' : 'Reps'}
                          </span>
                          <input
                            value={entry.result ?? ''}
                            onChange={(event) => updateEntry(item.id, { result: event.target.value })}
                            maxLength="200"
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
            maxLength="4000"
            value={draft.note}
            onChange={(event) => updateDraft((current) => ({
              ...current,
              note: event.target.value,
            }))}
            placeholder="Energy, technique, or what to adjust next time…"
          />
        </label>

        <footer className="workout-footer">
          <p>{completeCount} of {items.length} movements complete</p>
          <button
            className="primary-button"
            type="button"
            onClick={onFinish}
            disabled={!draft.startedAt || completeCount === 0 || finishing}
          >
            {finishing ? 'Saving to Janus…' : 'Finish session'} <Icon name="check" size={18} />
          </button>
        </footer>
      </section>

      <button className="text-button" type="button" onClick={onViewPlan}>
        Browse the full weekly plan <Icon name="arrow" size={16} />
      </button>
    </main>
  )
}
