import { useState } from 'react'
import AmbientBackground from './components/AmbientBackground.jsx'
import Dock from './components/Dock.jsx'
import { useAuth } from './context/useAuth.js'
import useHabits from './hooks/useHabits.js'
import AccountPage from './pages/AccountPage.jsx'
import HabitTracker from './pages/HabitTracker.jsx'
import LoginSplash from './pages/LoginSplash.jsx'

function HabitApp({ user, logout, offline }) {
  const [page, setPage] = useState('today')
  const store = useHabits(user, logout)
  const [timezone, setTimezone] = useState('')
  const [settingsMessage, setSettingsMessage] = useState('')
  const navigate = (next) => { setPage(next); window.scrollTo({ top: 0, behavior: 'smooth' }) }
  return <div className="app-shell"><AmbientBackground />
    {(offline || store.error) && <div className="app-notices" role="status">{offline && <p>Account connections are temporarily unavailable.</p>}{store.error && <p>{store.error} <button type="button" className="text-button" onClick={store.retry}>Retry</button></p>}</div>}
    {page === 'account' ? <AccountPage onBack={() => navigate('today')} onViewPlan={() => navigate('today')} offline={offline}>
      <section className="habit-account-settings"><p className="eyebrow">Calendar · daily boundaries</p><h2>Your timezone.</h2><p>Habits and streaks follow {store.state.timezone || 'your account timezone'}.</p>
        <form onSubmit={async (event) => { event.preventDefault(); setSettingsMessage(''); try { await store.mutate('/api/habits/settings', 'PUT', { timezone }); setSettingsMessage('Timezone saved.') } catch (failure) { setSettingsMessage(failure.message) } }}><label htmlFor="habit-timezone">Timezone</label><input id="habit-timezone" list="habit-timezones" required value={timezone} placeholder={store.state.timezone || 'Europe/Dublin'} onChange={(event) => setTimezone(event.target.value)} /><datalist id="habit-timezones">{(Intl.supportedValuesOf?.('timeZone') || ['UTC', 'Europe/Dublin']).map((zone) => <option key={zone} value={zone} />)}</datalist><button type="submit" className="primary-button" disabled={store.busy || store.loading}>Save timezone</button><span role="status">{settingsMessage}</span></form>
      </section></AccountPage> : <HabitTracker page={page} store={store} onPage={navigate} demo={import.meta.env.DEV && user.isDemo} onUnauthorized={logout} />}
    <Dock page={page} onChange={navigate} onLogout={logout} />
  </div>
}

export default function App() {
  const { user, loading, logout, sessionState } = useAuth()
  if (loading) return <main className="auth-loading" role="status" aria-live="polite"><img className="brand-mark" src="/aether-icon-128.webp" alt="" /><p>Restoring your session…</p></main>
  if (!user) return <LoginSplash />
  return <HabitApp key={user.accountId} user={user} logout={logout} offline={sessionState === 'offline'} />
}
