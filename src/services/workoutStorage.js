export const HISTORY_KEY = 'aether-workout-history'
export const DRAFT_KEY = 'aether-workout-drafts'

export function accountStorageKey(baseKey, accountId) {
  return `${baseKey}:${accountId}`
}

export function browserStorage() {
  try {
    return window.localStorage
  } catch {
    return null
  }
}

export function readAccountStorage(
  storage,
  accountKey,
  legacyKey,
  fallback,
  migrateLegacy = true,
) {
  if (!storage) return { value: fallback, found: false, available: false }

  try {
    const accountValue = storage.getItem(accountKey)
    if (accountValue !== null) {
      return { value: JSON.parse(accountValue), found: true, available: true }
    }

    const legacyValue = migrateLegacy ? storage.getItem(legacyKey) : null
    if (legacyValue === null) return { value: fallback, found: false, available: true }

    const value = JSON.parse(legacyValue)
    storage.setItem(accountKey, legacyValue)
    storage.removeItem(legacyKey)
    return { value, found: true, available: true, migrated: true }
  } catch {
    return { value: fallback, found: false, available: false }
  }
}

export function writeAccountStorage(storage, key, value) {
  if (!storage) return false
  try {
    storage.setItem(key, JSON.stringify(value))
    return true
  } catch {
    return false
  }
}

export function clearAccountWorkoutData(accountId, storage = browserStorage()) {
  if (!storage || !accountId) return false
  try {
    storage.removeItem(accountStorageKey(HISTORY_KEY, accountId))
    storage.removeItem(accountStorageKey(DRAFT_KEY, accountId))
    return true
  } catch {
    return false
  }
}
