import { useCallback, useEffect, useRef, useState } from 'react'
import { habitRequest } from '../services/habitApi.js'
import { checkinKey, dateInTimezone, shiftDate } from '../services/habits.js'

const emptyState = { habits: [], categories: [], groups: [], timezone: null, stats: {} }

export default function useHabits(user, onUnauthorized) {
  const key = `aether-habits-v1:${user.accountId}`
  const [state, setState] = useState(emptyState)
  const [checkins, setCheckins] = useState({})
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const alive = useRef(true)
  const mutation = useRef(false)
  const liveData = useRef({ state: emptyState, checkins: {} })
  const range = useRef(null)
  const demo = import.meta.env.DEV && user.isDemo

  const report = useCallback((failure) => {
    if (!alive.current) return
    setError(failure.status === 404 ? 'Habit sync is unavailable. Janus needs the habit-tracking update.' : failure.message)
    if (failure.status === 401) onUnauthorized()
  }, [onUnauthorized])

  const refresh = useCallback(async () => {
    let data = await habitRequest('/api/habits')
    if (!data.timezone) {
      await habitRequest('/api/habits/settings', 'PUT', { timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC' })
      data = await habitRequest('/api/habits')
    }
    const today = dateInTimezone(data.timezone)
    const selected = range.current || { start: shiftDate(today, -40), end: shiftDate(today, 2) }
    const result = await habitRequest(`/api/habit-checkins?start=${selected.start}&end=${selected.end}`)
    if (!alive.current) return
    setState(data)
    const nextCheckins = Object.fromEntries([...result.checkins, ...(data.today_checkins || [])].map((entry) => [checkinKey(entry.habit_id, entry.date), entry]))
    liveData.current = { state: data, checkins: nextCheckins }
    setCheckins((current) => Object.fromEntries(Object.entries({ ...current, ...nextCheckins }).filter(([, entry]) => data.habits.some((habit) => habit.id === entry.habit_id))))
  }, [])

  useEffect(() => {
    alive.current = true
    if (demo) {
      import('../data/habitDemo.js').then(({ createHabitDemo }) => {
        if (!alive.current) return
        let data
        try { data = JSON.parse(localStorage.getItem(key)) } catch { /* Use initial demo. */ }
        const initial = data || createHabitDemo()
        liveData.current = initial
        setState(initial.state)
        setCheckins(initial.checkins)
        setLoading(false)
      }).catch(report)
    } else {
      refresh().catch(report).finally(() => { if (alive.current) setLoading(false) })
    }
    return () => { alive.current = false }
  }, [demo, key, refresh, report])

  const loadRange = useCallback(async (start, end) => {
    range.current = { start, end }
    if (demo) return
    try {
      const result = await habitRequest(`/api/habit-checkins?start=${start}&end=${end}`)
      if (alive.current && range.current.start === start && range.current.end === end) {
        setCheckins((current) => ({ ...current, ...Object.fromEntries(result.checkins.map((entry) => [checkinKey(entry.habit_id, entry.date), entry])) }))
        setError('')
      }
    } catch (failure) { report(failure); throw failure }
  }, [demo, report])

  const mutate = async (path, method, body) => {
    if (mutation.current) throw new Error('Please wait for the current change to finish.')
    mutation.current = true
    setBusy(true)
    setError('')
    try {
      if (demo) {
        const { mutateHabitDemo } = await import('../data/habitDemo.js')
        const next = mutateHabitDemo(liveData.current, path, method, body)
        localStorage.setItem(key, JSON.stringify(next))
        liveData.current = next
        setState(next.state)
        setCheckins(next.checkins)
        return next.result
      }
      const result = await habitRequest(path, method, body)
      if (result.checkin) setCheckins((current) => ({ ...current, [checkinKey(result.checkin.habit_id, result.checkin.date)]: result.checkin }))
      // A successful write is authoritative even if refreshing the view fails.
      try { await refresh() } catch (failure) { report(failure) }
      return result
    } catch (failure) { report(failure); throw failure }
    finally { mutation.current = false; if (alive.current) setBusy(false) }
  }

  const retry = useCallback(() => { if (!demo) return refresh().catch(report) }, [demo, refresh, report])
  return { state, checkins, loading, busy, error, mutate, loadRange, retry }
}
