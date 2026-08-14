import { useState } from 'react'
import Brand from '../components/Brand.jsx'
import Icon from '../components/Icon.jsx'
import { formatDate } from '../utils/date.js'

function localDateTimeValue(value) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000)
  return local.toISOString().slice(0, 16)
}

function editValues(entry) {
  return {
    finishedAt: localDateTimeValue(entry.finishedAt),
    durationMinutes: String(entry.durationMinutes),
    completed: String(entry.completed),
    note: entry.note || '',
  }
}

export default function HistoryPage({
  history,
  loading,
  onSave,
  onDelete,
  onTrain,
  onViewPlan,
}) {
  const [editingId, setEditingId] = useState('')
  const [form, setForm] = useState(null)
  const [busyId, setBusyId] = useState('')
  const [error, setError] = useState('')
  const totalMinutes = history.reduce((total, item) => total + item.durationMinutes, 0)
  const thisMonth = history.filter((item) => {
    const date = new Date(item.finishedAt)
    const now = new Date()
    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()
  }).length

  const beginEdit = (entry) => {
    setEditingId(entry.id)
    setForm(editValues(entry))
    setError('')
  }

  const handleSave = async (event, entry) => {
    event.preventDefault()
    setBusyId(entry.id)
    setError('')
    try {
      await onSave({
        ...entry,
        finishedAt: new Date(form.finishedAt).toISOString(),
        durationMinutes: Number(form.durationMinutes),
        completed: Number(form.completed),
        note: form.note.trim(),
      })
      setEditingId('')
      setForm(null)
    } catch (requestError) {
      setError(requestError.message || 'Could not update this workout.')
    } finally {
      setBusyId('')
    }
  }

  const handleDelete = async (entry) => {
    if (!window.confirm(`Delete ${entry.title} from your workout history?`)) return
    setBusyId(entry.id)
    setError('')
    try {
      await onDelete(entry.id)
      if (editingId === entry.id) {
        setEditingId('')
        setForm(null)
      }
    } catch (requestError) {
      setError(requestError.message || 'Could not delete this workout.')
    } finally {
      setBusyId('')
    }
  }

  return (
    <main className="page content-page">
      <Brand onPlan={onViewPlan} />
      <section className="content-hero history-hero">
        <div>
          <p className="eyebrow">Training record</p>
          <h1>Work done.</h1>
          <p>Small sessions, repeated. That’s the whole idea.</p>
        </div>
        <div className="history-stats">
          <div><strong>{history.length}</strong><span>Sessions</span></div>
          <div><strong>{totalMinutes}</strong><span>Minutes</span></div>
          <div><strong>{thisMonth}</strong><span>This month</span></div>
        </div>
      </section>

      {error && <p className="settings-message is-error history-message" role="alert">{error}</p>}

      {loading && history.length === 0 ? (
        <section className="empty-state" aria-live="polite">
          <span>···</span>
          <h2>Loading workout history.</h2>
          <p>Syncing this Janus account with Firestore.</p>
        </section>
      ) : history.length === 0 ? (
        <section className="empty-state">
          <span>00</span>
          <h2>No sessions logged yet.</h2>
          <p>Finish your first workout and it’ll show up here.</p>
          <button className="primary-button" type="button" onClick={onTrain}>
            Start training <Icon name="arrow" size={18} />
          </button>
        </section>
      ) : (
        <section className="history-list">
          {history.map((entry) => {
            const editing = editingId === entry.id
            const busy = busyId === entry.id
            return (
              <article className={`history-card${editing ? ' is-editing' : ''}`} key={entry.id}>
                <time dateTime={entry.finishedAt}>
                  <strong>{formatDate(entry.finishedAt, { day: '2-digit' })}</strong>
                  <span>{formatDate(entry.finishedAt, { month: 'short' })}</span>
                </time>
                <div className="history-card-main">
                  <span>{entry.day}</span>
                  <h2>{entry.title}</h2>
                  {entry.note && <p>“{entry.note}”</p>}
                </div>
                <div className="history-card-result">
                  <strong>{entry.completed}/{entry.total}</strong>
                  <span>{entry.durationMinutes} min</span>
                  <div className="history-card-actions">
                    <button type="button" onClick={() => beginEdit(entry)} disabled={busy}>
                      Edit
                    </button>
                    <button type="button" onClick={() => handleDelete(entry)} disabled={busy}>
                      {busy ? 'Working…' : 'Delete'}
                    </button>
                  </div>
                </div>

                {editing && form && (
                  <form className="history-edit-form" onSubmit={(event) => handleSave(event, entry)}>
                    <label>
                      <span>Finished</span>
                      <input
                        type="datetime-local"
                        value={form.finishedAt}
                        onChange={(event) => setForm((current) => ({ ...current, finishedAt: event.target.value }))}
                        required
                        disabled={busy}
                      />
                    </label>
                    <label>
                      <span>Duration</span>
                      <input
                        type="number"
                        min="1"
                        max="1440"
                        value={form.durationMinutes}
                        onChange={(event) => setForm((current) => ({ ...current, durationMinutes: event.target.value }))}
                        required
                        disabled={busy}
                      />
                    </label>
                    <label>
                      <span>Completed of {entry.total}</span>
                      <input
                        type="number"
                        min="0"
                        max={entry.total}
                        value={form.completed}
                        onChange={(event) => setForm((current) => ({ ...current, completed: event.target.value }))}
                        required
                        disabled={busy}
                      />
                    </label>
                    <label className="history-edit-note">
                      <span>Session note</span>
                      <textarea
                        rows="3"
                        maxLength="4000"
                        value={form.note}
                        onChange={(event) => setForm((current) => ({ ...current, note: event.target.value }))}
                        disabled={busy}
                      />
                    </label>
                    <div className="history-edit-actions">
                      <button type="button" onClick={() => { setEditingId(''); setForm(null) }} disabled={busy}>
                        Cancel
                      </button>
                      <button type="submit" disabled={busy}>
                        {busy ? 'Saving…' : 'Save changes'}
                      </button>
                    </div>
                  </form>
                )}
              </article>
            )
          })}
        </section>
      )}
    </main>
  )
}
