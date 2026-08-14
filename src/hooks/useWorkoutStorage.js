import { useCallback, useEffect, useState } from 'react'
import {
  deleteWorkoutHistoryEntry,
  listWorkoutHistory,
  saveWorkoutHistoryEntry,
} from '../services/workoutApi.js'
import {
  accountStorageKey,
  browserStorage,
  DRAFT_KEY,
  HISTORY_KEY,
  HISTORY_MIGRATION_KEY,
  readAccountStorage,
  writeAccountStorage,
} from '../services/workoutStorage.js'

const newestFirst = (entries) => [...entries].sort(
  (left, right) => new Date(right.finishedAt) - new Date(left.finishedAt),
)

const replaceEntry = (entries, replacement) => newestFirst([
  replacement,
  ...entries.filter((entry) => entry.id !== replacement.id),
])

function historyErrorMessage(error) {
  if (error?.status === 401) return 'Your Janus session has expired. Sign in again.'
  if (error?.status === 404) return 'Janus does not have workout sync available yet.'
  return error?.message || 'Workout history could not be synced with Janus.'
}

export default function useWorkoutStorage(user, scheduledWorkoutId, onUnauthorized) {
  const storage = browserStorage()
  const draftKey = accountStorageKey(DRAFT_KEY, user.accountId)
  const historyKey = accountStorageKey(HISTORY_KEY, user.accountId)
  const migrationKey = accountStorageKey(HISTORY_MIGRATION_KEY, user.accountId)
  const [initial] = useState(() => ({
    drafts: readAccountStorage(storage, draftKey, DRAFT_KEY, {}, !user.isDemo),
    history: readAccountStorage(storage, historyKey, HISTORY_KEY, [], !user.isDemo),
  }))
  const [drafts, setDrafts] = useState(initial.drafts.value)
  const [history, setHistory] = useState(initial.history.value)
  const [historyLoading, setHistoryLoading] = useState(!user.isDemo)
  const [historyError, setHistoryError] = useState('')
  const [storageError, setStorageError] = useState(
    !initial.drafts.available || !initial.history.available,
  )

  const reportHistoryError = useCallback((error) => {
    setHistoryError(historyErrorMessage(error))
    if (error?.status === 401) onUnauthorized()
  }, [onUnauthorized])

  useEffect(() => {
    if (!import.meta.env.DEV || !user.isDemo) return undefined
    if (initial.drafts.found && initial.history.found) return undefined

    let active = true
    import('../data/demoData.js')
      .then(({ createDemoDrafts, createDemoHistory }) => {
        if (!active) return
        if (!initial.drafts.found) setDrafts(createDemoDrafts(scheduledWorkoutId))
        if (!initial.history.found) setHistory(createDemoHistory())
      })
      .catch(() => {
        if (active) setStorageError(true)
      })

    return () => { active = false }
  }, [initial.drafts.found, initial.history.found, scheduledWorkoutId, user.isDemo])

  useEffect(() => {
    if (user.isDemo) return undefined
    let active = true

    const loadHistory = async () => {
      try {
        const migrationComplete = storage?.getItem(migrationKey) === 'complete'
        if (!migrationComplete) {
          for (const entry of initial.history.value) {
            await saveWorkoutHistoryEntry(entry)
          }
        }

        const remoteHistory = await listWorkoutHistory()
        if (!active) return
        setHistory(newestFirst(remoteHistory))
        setHistoryError('')
        if (!migrationComplete) storage?.setItem(migrationKey, 'complete')
      } catch (error) {
        if (active) reportHistoryError(error)
      } finally {
        if (active) setHistoryLoading(false)
      }
    }

    loadHistory()
    return () => { active = false }
  }, [initial.history.value, migrationKey, reportHistoryError, storage, user.isDemo])

  useEffect(() => {
    if (!writeAccountStorage(storage, draftKey, drafts)) {
      queueMicrotask(() => setStorageError(true))
    }
  }, [draftKey, drafts, storage])

  useEffect(() => {
    if (!writeAccountStorage(storage, historyKey, history)) {
      queueMicrotask(() => setStorageError(true))
    }
  }, [history, historyKey, storage])

  const saveHistoryEntry = useCallback(async (entry) => {
    setHistoryError('')
    if (user.isDemo) {
      setHistory((current) => replaceEntry(current, entry))
      return entry
    }

    try {
      const saved = await saveWorkoutHistoryEntry(entry)
      setHistory((current) => replaceEntry(current, saved))
      return saved
    } catch (error) {
      reportHistoryError(error)
      throw error
    }
  }, [reportHistoryError, user.isDemo])

  const deleteHistoryEntry = useCallback(async (entryId) => {
    setHistoryError('')
    if (!user.isDemo) {
      try {
        await deleteWorkoutHistoryEntry(entryId)
      } catch (error) {
        reportHistoryError(error)
        throw error
      }
    }
    setHistory((current) => current.filter((entry) => entry.id !== entryId))
  }, [reportHistoryError, user.isDemo])

  return {
    drafts,
    setDrafts,
    history,
    historyLoading,
    historyError,
    saveHistoryEntry,
    deleteHistoryEntry,
    storageError,
  }
}
