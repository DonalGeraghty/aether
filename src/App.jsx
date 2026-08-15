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
import WorkoutLogPage from './pages/WorkoutLogPage.jsx'
import { blankDraft, createHistoryEntry } from './services/workoutSession.js'

function WorkoutApp({ user, logout, offline }) {
  const scheduled = useMemo(() => scheduledWorkout(), [])
  const [page, setPage] = useState('log')
  const [selectedId, setSelectedId] = useState(scheduled.id)
  const [finishing, setFinishing] = useState(false)
  const {
    drafts,
    setDrafts,
    history,
    historyLoading,
    historyError,
    saveHistoryEntry,
    deleteHistoryEntry,
    storageError,
  } = useWorkoutStorage(user, scheduled.id, logout)

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

  const showPlan = () => {
    setPage('plan')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const finishWorkout = async () => {
    const historyEntry = createHistoryEntry(selectedWorkout, draft)
    setFinishing(true)
    try {
      await saveHistoryEntry(historyEntry)
      setDrafts((current) => {
        const next = { ...current }
        delete next[selectedWorkout.id]
        return next
      })
      setPage('history')
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch {
      // The draft stays intact and the sync error is shown above the app.
    } finally {
      setFinishing(false)
    }
  }

  return (
    <div className="app-shell">
      <AmbientBackground />

      {(offline || storageError || historyError) && (
        <div className="app-notices" role="status">
          {offline && <p>Offline mode · account connections are temporarily unavailable.</p>}
          {storageError && <p>Device storage is unavailable · workout changes may not persist.</p>}
          {historyError && <p>{historyError}</p>}
        </div>
      )}

      {page === 'log' && (
        <WorkoutLogPage
          onLog={saveHistoryEntry}
          onAccount={() => setPage('account')}
          onUnauthorized={logout}
          onViewPlan={showPlan}
          demo={user.isDemo}
        />
      )}

      {page === 'plan' && (
        <PlanPage selectedId={selectedId} onChoose={chooseWorkout} onViewPlan={showPlan} />
      )}
      {page === 'today' && (
        <TodayPage
          workout={selectedWorkout}
          draft={draft}
          updateDraft={updateDraft}
          onFinish={finishWorkout}
          finishing={finishing}
          onViewPlan={showPlan}
        />
      )}
      {page === 'history' && (
        <HistoryPage
          history={history}
          loading={historyLoading}
          onSave={saveHistoryEntry}
          onDelete={deleteHistoryEntry}
          onTrain={() => setPage('today')}
          onViewPlan={showPlan}
        />
      )}
      {page === 'account' && (
        <AccountPage onBack={() => setPage('log')} onViewPlan={showPlan} offline={offline} />
      )}

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
