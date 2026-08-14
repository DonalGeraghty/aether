import { useState } from 'react'
import AISettings from '../components/AISettings.jsx'
import { useAuth } from '../context/AuthContext.jsx'

export default function AccountPage({ onBack }) {
  const { user, deleteAccount } = useAuth()
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const handleDelete = async (event) => {
    event.preventDefault()
    setError('')
    if (!password) {
      setError('Enter your password to confirm.')
      return
    }
    if (!window.confirm('Delete your account permanently? All server data for this account will be removed. This cannot be undone.')) return

    setBusy(true)
    try {
      await deleteAccount(password)
    } catch (requestError) {
      setError(requestError.message || 'Something went wrong')
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="page account-page">
      <header className="brand">
        <img className="brand-mark" src="/Aether-icon.png" alt="" />
        <span>Aether</span>
      </header>

      <section className="account-hero">
        <div>
          <p className="eyebrow">Identity · connections</p>
          <h1>Account.</h1>
        </div>
        <div className="account-identity">
          <span>Signed in as</span>
          <strong>{user?.email}</strong>
          <button type="button" onClick={onBack}>← Back to training</button>
        </div>
      </section>

      {user?.isDemo && <p className="demo-account-note">Local demo account · nothing here is written to Janus or Firestore.</p>}

      <AISettings />

      {!user?.isDemo && (
        <section className="danger-card" aria-labelledby="danger-heading">
          <div>
            <p className="settings-kicker">Danger zone</p>
            <h2 id="danger-heading">Delete account.</h2>
            <p>This permanently removes your Janus account and its associated server data.</p>
          </div>
          <form onSubmit={handleDelete}>
            <label htmlFor="delete-password">Confirm with your password</label>
            <input id="delete-password" type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Current password" disabled={busy} />
            {error && <p className="settings-message is-error" role="alert">{error}</p>}
            <button type="submit" disabled={busy}>{busy ? 'Deleting…' : 'Delete my account'}</button>
          </form>
        </section>
      )}
    </main>
  )
}
