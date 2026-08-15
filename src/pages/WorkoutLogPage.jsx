import { useState } from 'react'
import Brand from '../components/Brand.jsx'
import Icon from '../components/Icon.jsx'
import {
  analyzeWorkout,
  createAIWorkoutHistoryEntry,
} from '../services/workoutApi.js'
import { workoutAIError } from '../utils/aiErrors.js'

function exerciseDetails(exercise) {
  return [
    exercise.sets ? `${exercise.sets} ${exercise.sets === 1 ? 'set' : 'sets'}` : '',
    exercise.reps || '',
    exercise.weight || '',
    exercise.duration || '',
    exercise.distance || '',
    exercise.notes || '',
  ].filter(Boolean)
}

export default function WorkoutLogPage({
  onLog,
  onAccount,
  onUnauthorized,
  onViewPlan,
  demo,
}) {
  const [message, setMessage] = useState('')
  const [sourceMessage, setSourceMessage] = useState('')
  const [analysis, setAnalysis] = useState(null)
  const [busy, setBusy] = useState('')
  const [error, setError] = useState('')
  const [showAccount, setShowAccount] = useState(false)
  const [logged, setLogged] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()
    const submittedMessage = message.trim()
    if (!submittedMessage || busy) return
    if (demo) {
      setError('AI workout logging needs a signed-in Janus account with a connected provider.')
      setShowAccount(false)
      return
    }

    setBusy('analyze')
    setError('')
    setShowAccount(false)
    setAnalysis(null)
    setLogged(false)
    try {
      const result = await analyzeWorkout(submittedMessage)
      setAnalysis(result)
      setSourceMessage(submittedMessage)
      setMessage('')
    } catch (requestError) {
      if (requestError?.status === 401) onUnauthorized()
      const details = workoutAIError(requestError)
      setError(details.message)
      setShowAccount(details.showAccount)
    } finally {
      setBusy('')
    }
  }

  const handleLog = async () => {
    if (!analysis?.exercises?.length || logged || busy) return
    setBusy('log')
    setError('')
    setShowAccount(false)
    try {
      await onLog(createAIWorkoutHistoryEntry(analysis, sourceMessage))
      setLogged(true)
    } catch (requestError) {
      if (requestError?.status === 401) onUnauthorized()
      setError(requestError?.message || 'Could not log this workout.')
    } finally {
      setBusy('')
    }
  }

  return (
    <main className="page workout-log-page">
      <Brand onPlan={onViewPlan} />
      <section className="workout-log-hero">
        <p className="eyebrow">Natural language training record</p>
        <h1>Workout log.</h1>
        <p>Describe what you did. Aether will structure it for you to review before anything is saved.</p>
      </section>

      <form className="workout-log-composer" onSubmit={handleSubmit}>
        <label htmlFor="workout-message">Tell Aether about your workout</label>
        <textarea
          id="workout-message"
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
              event.preventDefault()
              event.currentTarget.form.requestSubmit()
            }
          }}
          placeholder="I did 3 sets of 10 goblet squats at 20 kg, then rowed 5 km in 24 minutes…"
          rows="6"
          maxLength="2000"
          disabled={Boolean(busy)}
        />
        <div>
          <span>Ctrl/⌘ + Enter to send</span>
          <button className="primary-button" type="submit" disabled={Boolean(busy) || !message.trim()}>
            {busy === 'analyze' ? 'Analyzing…' : 'Analyze workout'}
            <Icon name="arrow" size={18} />
          </button>
        </div>
      </form>

      {error && (
        <div className="workout-log-error" role="alert">
          <p>{error}</p>
          {showAccount && <button type="button" onClick={onAccount}>Open Account</button>}
        </div>
      )}

      {analysis && (
        <section className="workout-analysis" aria-live="polite">
          <header className="workout-analysis-heading">
            <div>
              <p className="eyebrow">Ready to review</p>
              <h2>{analysis.title}</h2>
              <p>{analysis.summary}</p>
            </div>
            <div className="workout-analysis-meta">
              <strong>{analysis.duration_minutes} min</strong>
              <span>{analysis.intensity} intensity</span>
              <span>{analysis.confidence} confidence</span>
            </div>
          </header>

          {analysis.exercises?.length ? (
            <ol className="analyzed-exercise-list">
              {analysis.exercises.map((exercise, index) => (
                <li key={`${exercise.name}-${index}`}>
                  <span>{String(index + 1).padStart(2, '0')}</span>
                  <div>
                    <strong>{exercise.name}</strong>
                    <p>{exerciseDetails(exercise).join(' · ') || 'Completed'}</p>
                  </div>
                </li>
              ))}
            </ol>
          ) : (
            <p className="workout-clarification">Add a little more detail before logging this workout.</p>
          )}

          {analysis.assumptions?.length > 0 && (
            <details className="workout-assumptions">
              <summary>Assumptions</summary>
              <ul>{analysis.assumptions.map((item, index) => <li key={index}>{item}</li>)}</ul>
            </details>
          )}

          {analysis.needs_clarification && analysis.clarification_question && (
            <p className="workout-clarification">{analysis.clarification_question}</p>
          )}

          <footer className="workout-analysis-footer">
            <p>{logged ? 'Saved to your Janus workout history.' : 'Nothing is saved until you confirm.'}</p>
            <button
              className="primary-button"
              type="button"
              onClick={handleLog}
              disabled={Boolean(busy) || logged || !analysis.exercises?.length}
            >
              {busy === 'log' ? 'Logging…' : logged ? 'Workout logged' : 'Log workout'}
              <Icon name="check" size={18} />
            </button>
          </footer>
        </section>
      )}
    </main>
  )
}
