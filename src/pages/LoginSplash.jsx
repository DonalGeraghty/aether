import { useState } from 'react'
import AmbientBackground from '../components/AmbientBackground.jsx'
import Brand from '../components/Brand.jsx'
import Icon from '../components/Icon.jsx'
import { useAuth } from '../context/useAuth.js'

export default function LoginSplash() {
  const { login, loginAsDemo, register } = useAuth()
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const selectMode = (nextMode) => {
    setMode(nextMode)
    setError('')
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      if (mode === 'login') await login(email.trim(), password)
      else await register(email.trim(), password)
    } catch (requestError) {
      setError(requestError.message || 'Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="auth-page">
      <AmbientBackground />

      <section className="auth-layout">
        <div className="auth-intro">
          <Brand />
          <div>
            <p className="eyebrow">Home training · remembered</p>
            <h1>Return to<br />the work.</h1>
            <p>Use the same account you use with Nyx. Your identity is securely handled by Janus.</p>
          </div>
        </div>

        <div className="auth-panel">
          <div className="auth-panel-heading">
            <p className="eyebrow">Member access</p>
            <h2>{mode === 'login' ? 'Welcome back.' : 'Create your account.'}</h2>
            <p>{mode === 'login' ? 'Sign in to open your training log.' : 'One account for Aether and Nyx.'}</p>
          </div>

          <div className="auth-tabs" role="tablist" aria-label="Account action">
            <button type="button" role="tab" aria-selected={mode === 'login'} onClick={() => selectMode('login')}>Sign in</button>
            <button type="button" role="tab" aria-selected={mode === 'register'} onClick={() => selectMode('register')}>Create account</button>
          </div>

          {import.meta.env.DEV && (
            <button className="demo-login-button" type="button" onClick={loginAsDemo}>
              <span><strong>Explore demo</strong><small>Preloaded training data · no account needed</small></span>
              <Icon name="arrow" size={18} />
            </button>
          )}

          <form className="auth-form" onSubmit={handleSubmit}>
            <label>
              <span>Email</span>
              <input
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                required
              />
            </label>
            <label>
              <span>Password</span>
              <input
                type="password"
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder={mode === 'register' ? 'At least 8 characters' : '••••••••'}
                minLength={mode === 'register' ? 8 : undefined}
                required
              />
            </label>

            {error && <p className="auth-error" role="alert">{error}</p>}

            <button className="primary-button auth-submit" type="submit" disabled={submitting}>
              {submitting ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}
              {!submitting && <Icon name="arrow" size={18} />}
            </button>
          </form>

          <p className="auth-footnote">Authentication is shared with Nyx through Janus API.</p>
        </div>
      </section>
    </main>
  )
}
