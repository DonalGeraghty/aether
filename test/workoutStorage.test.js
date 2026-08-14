import assert from 'node:assert/strict'
import test from 'node:test'
import {
  accountStorageKey,
  clearAccountWorkoutData,
  DRAFT_KEY,
  HISTORY_KEY,
  HISTORY_MIGRATION_KEY,
  readAccountStorage,
  writeAccountStorage,
} from '../src/services/workoutStorage.js'

function memoryStorage(initial = {}) {
  const values = new Map(Object.entries(initial))
  return {
    getItem: (key) => values.has(key) ? values.get(key) : null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: (key) => values.delete(key),
    values,
  }
}

test('accountStorageKey keeps workout data isolated by Janus account', () => {
  assert.equal(accountStorageKey(HISTORY_KEY, 'account-1'), 'aether-workout-history:account-1')
  assert.notEqual(
    accountStorageKey(DRAFT_KEY, 'account-1'),
    accountStorageKey(DRAFT_KEY, 'account-2'),
  )
})

test('readAccountStorage migrates valid legacy data once', () => {
  const storage = memoryStorage({ [HISTORY_KEY]: JSON.stringify([{ id: 'legacy' }]) })
  const accountKey = accountStorageKey(HISTORY_KEY, 'account-1')

  const result = readAccountStorage(storage, accountKey, HISTORY_KEY, [])

  assert.deepEqual(result.value, [{ id: 'legacy' }])
  assert.equal(result.migrated, true)
  assert.equal(storage.getItem(HISTORY_KEY), null)
  assert.equal(storage.getItem(accountKey), JSON.stringify([{ id: 'legacy' }]))
})

test('storage helpers fail safely when persistence is unavailable', () => {
  const brokenStorage = {
    getItem: () => { throw new Error('blocked') },
    setItem: () => { throw new Error('blocked') },
  }

  assert.deepEqual(
    readAccountStorage(brokenStorage, 'account', 'legacy', ['fallback']).value,
    ['fallback'],
  )
  assert.equal(writeAccountStorage(brokenStorage, 'account', {}), false)
})

test('clearAccountWorkoutData removes only the selected account workout keys', () => {
  const firstHistory = accountStorageKey(HISTORY_KEY, 'account-1')
  const firstDraft = accountStorageKey(DRAFT_KEY, 'account-1')
  const secondHistory = accountStorageKey(HISTORY_KEY, 'account-2')
  const firstMigration = accountStorageKey(HISTORY_MIGRATION_KEY, 'account-1')
  const storage = memoryStorage({
    [firstHistory]: '[]',
    [firstDraft]: '{}',
    [firstMigration]: 'complete',
    [secondHistory]: '[{"id":"keep"}]',
  })

  assert.equal(clearAccountWorkoutData('account-1', storage), true)
  assert.equal(storage.getItem(firstHistory), null)
  assert.equal(storage.getItem(firstDraft), null)
  assert.equal(storage.getItem(firstMigration), null)
  assert.equal(storage.getItem(secondHistory), '[{"id":"keep"}]')
})
