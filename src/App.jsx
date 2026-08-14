import { useMemo, useState } from 'react'
import AmbientBackground from './components/AmbientBackground.jsx'
import Dock from './components/Dock.jsx'
import { useAuth } from './context/useAuth.js'
import { scheduledWorkout, workouts } from './data/workouts.js'
import useWorkoutStorage from './hooks/useWorkoutStorage.js'
import AccountPage from './pages/AccountPage.jsx'
import HistoryPage from './pages/HistoryPage.jsx'
import LoginSplash from './pages/LoginSplash.jsx'
import PlanPage from './pages/PlanPage.jsx'
import TodayPage from './pages/TodayPage.jsx'
import { blankDraft, createHistoryEntry } from './services/workoutSession.js'

function WorkoutApp({ user, logout, offline }) {
  const scheduled = useMemo(() => scheduledWorkout(), [])
  const [page, setPage] = useState('today')
  const [selectedId, setSelectedId] = useState(scheduled.id)
  const {
    drafts,
    setDrafts,
    history,
    setHistory,
    storageError,
  } = useWorkoutStorage(user, scheduled.id)

  const selectedWorkout = workouts.find((workout) => workout.id === selectedId) ?? scheduled
  const draft = drafts[selectedWorkout.id] ?? blankDraft()

  const updateDraft = (updater) => {
    setDrafts((current) => ({
      ...current,
      [selectedWorkout.id]: typeof updater === 'function'
        ? updater(current[selectedWorkout.id] ?? blankDraft())
        : updater,
    }))
  }

  const chooseWorkout = (id) => {
    setSelectedId(id)
    setPage('today')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const finishWorkout = () => {
    const historyEntry = createHistoryEntry(selectedWorkout, draft)
    setHistory((current) => [historyEntry, ...current])
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
      <AmbientBackground />

      {(offline || storageError) && (
        <div className="app-notices" role="status">
          {offline && <p>Offline mode · account connections are temporarily unavailable.</p>}
          {storageError && <p>Device storage is unavailable · workout changes may not persist.</p>}
        </div>
      )}

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
      {page === 'history' && (
        <HistoryPage history={history} onTrain={() => setPage('today')} />
      )}
      {page === 'account' && <AccountPage onBack={() => setPage('today')} offline={offline} />}

      <Dock page={page} onChange={setPage} onLogout={logout} />
    </div>
  )
}

export default function App() {
  const { user, loading, logout, sessionState } = useAuth()

  if (loading) {
    return (
      <main className="auth-loading" role="status" aria-live="polite">
        <img className="brand-mark" src="/aether-icon-128.webp" alt="" />
        <p>Restoring your session…</p>
      </main>
    )
  }

  if (!user) return <LoginSplash />

  return (
    <WorkoutApp
      key={user.accountId}
      user={user}
      logout={logout}
      offline={sessionState === 'offline'}
    />
  )
}
