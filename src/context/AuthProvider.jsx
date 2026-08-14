import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { AuthContext } from './authContext.js'
import {
  API_BASE_URL,
  API_ENDPOINTS,
  authFetch,
  getStoredToken,
  setStoredToken,
} from '../config/api.js'
import { clearAccountWorkoutData } from '../services/workoutStorage.js'

const PROFILE_KEY = 'aether_auth_profile'
const DEMO_TOKEN = 'local-aether-demo-session'
const DEMO_USER = {
  email: 'demo@aether.local',
  accountId: 'local-demo-account',
  isDemo: true,
}

function getStoredProfile() {
  try {
    const value = localStorage.getItem(PROFILE_KEY)
    return value ? JSON.parse(value) : null
  } catch {
    return null
  }
}

function setStoredProfile(profile) {
  try {
    if (profile) localStorage.setItem(PROFILE_KEY, JSON.stringify(profile))
    else localStorage.removeItem(PROFILE_KEY)
  } catch {
    // The live session still works if persistent storage is unavailable.
  }
}

function userFromResponse(data, fallbackEmail = '') {
  const email = data.user?.email || fallbackEmail
  const accountId = data.user?.account_id
  if (!email || !accountId) throw new Error('Authentication response was incomplete')
  return { email, accountId }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [sessionState, setSessionState] = useState('loading')

  const applySession = useCallback((profile, token) => {
    setStoredToken(token)
    setStoredProfile(profile)
    setUser(profile)
    setSessionState('verified')
  }, [])

  const logout = useCallback(() => {
    setStoredToken('')
    setStoredProfile(null)
    setUser(null)
    setSessionState('anonymous')
  }, [])

  const bootstrap = useCallback(async () => {
    const token = getStoredToken()
    if (import.meta.env.DEV && token === DEMO_TOKEN) {
      setUser(DEMO_USER)
      setSessionState('verified')
      setLoading(false)
      return
    }
    if (!token) {
      setUser(null)
      setSessionState('anonymous')
      setLoading(false)
      return
    }

    try {
      const response = await authFetch(API_ENDPOINTS.AUTH_ME, { method: 'GET' })
      const data = await response.json().catch(() => ({}))
      if (response.ok) {
        const profile = userFromResponse(data)
        setStoredProfile(profile)
        setUser(profile)
        setSessionState('verified')
      } else if (response.status === 401 || response.status === 403) {
        logout()
      } else {
        const profile = getStoredProfile()
        setUser(profile ? { ...profile, offlineSession: true } : null)
        setSessionState(profile ? 'offline' : 'anonymous')
      }
    } catch {
      const profile = getStoredProfile()
      setUser(profile ? { ...profile, offlineSession: true } : null)
      setSessionState(profile ? 'offline' : 'anonymous')
    } finally {
      setLoading(false)
    }
  }, [logout])

  useEffect(() => {
    const timer = window.setTimeout(bootstrap, 0)
    return () => window.clearTimeout(timer)
  }, [bootstrap])

  useEffect(() => {
    if (sessionState !== 'offline') return undefined
    const revalidate = () => bootstrap()
    window.addEventListener('online', revalidate)
    return () => window.removeEventListener('online', revalidate)
  }, [bootstrap, sessionState])

  const authenticate = useCallback(async (endpoint, email, password) => {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    const data = await response.json().catch(() => ({}))
    if (!response.ok) throw new Error(data.error || 'Authentication failed')
    const profile = userFromResponse(data, email)
    if (!data.token) throw new Error('Authentication response did not include a token')
    applySession(profile, data.token)
    return data
  }, [applySession])

  const login = useCallback(
    (email, password) => authenticate(API_ENDPOINTS.AUTH_LOGIN, email, password),
    [authenticate],
  )

  const register = useCallback(
    (email, password) => authenticate(API_ENDPOINTS.AUTH_REGISTER, email, password),
    [authenticate],
  )

  const deleteAccount = useCallback(async (password) => {
    if (!user?.email || user?.isDemo) throw new Error('Account deletion is unavailable')
    const response = await authFetch(API_ENDPOINTS.AUTH_DELETE_ACCOUNT, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    })
    const data = await response.json().catch(() => ({}))
    if (!response.ok) throw new Error(data.error || 'Could not delete account')
    clearAccountWorkoutData(user.accountId)
    logout()
  }, [logout, user])

  const loginAsDemo = useCallback(() => {
    if (!import.meta.env.DEV) return
    applySession(DEMO_USER, DEMO_TOKEN)
  }, [applySession])

  const value = useMemo(() => ({
    user,
    loading,
    sessionState,
    login,
    loginAsDemo,
    register,
    logout,
    deleteAccount,
  }), [user, loading, sessionState, login, loginAsDemo, register, logout, deleteAccount])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
