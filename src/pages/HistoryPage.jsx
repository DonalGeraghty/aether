import Brand from '../components/Brand.jsx'
import Icon from '../components/Icon.jsx'
import { formatDate } from '../utils/date.js'

export default function HistoryPage({ history, onTrain, onViewPlan }) {
  const totalMinutes = history.reduce((total, item) => total + item.durationMinutes, 0)
  const thisMonth = history.filter((item) => {
    const date = new Date(item.finishedAt)
    const now = new Date()
    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()
  }).length

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

      {history.length === 0 ? (
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
          {history.map((entry) => (
            <article className="history-card" key={entry.id}>
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
              </div>
            </article>
          ))}
        </section>
      )}
    </main>
  )
}
