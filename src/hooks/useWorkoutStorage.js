import { useEffect, useState } from 'react'
import {
  accountStorageKey,
  browserStorage,
  DRAFT_KEY,
  HISTORY_KEY,
  readAccountStorage,
  writeAccountStorage,
} from '../services/workoutStorage.js'

export default function useWorkoutStorage(user, scheduledWorkoutId) {
  const storage = browserStorage()
  const draftKey = accountStorageKey(DRAFT_KEY, user.accountId)
  const historyKey = accountStorageKey(HISTORY_KEY, user.accountId)
  const [initial] = useState(() => ({
    drafts: readAccountStorage(storage, draftKey, DRAFT_KEY, {}, !user.isDemo),
    history: readAccountStorage(storage, historyKey, HISTORY_KEY, [], !user.isDemo),
  }))
  const [drafts, setDrafts] = useState(initial.drafts.value)
  const [history, setHistory] = useState(initial.history.value)
  const [storageError, setStorageError] = useState(
    !initial.drafts.available || !initial.history.available,
  )

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
    if (!writeAccountStorage(storage, draftKey, drafts)) {
      queueMicrotask(() => setStorageError(true))
    }
  }, [draftKey, drafts, storage])

  useEffect(() => {
    if (!writeAccountStorage(storage, historyKey, history)) {
      queueMicrotask(() => setStorageError(true))
    }
  }, [history, historyKey, storage])

  return { drafts, setDrafts, history, setHistory, storageError }
}
