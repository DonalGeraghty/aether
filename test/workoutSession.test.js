import assert from 'node:assert/strict'
import test from 'node:test'
import { workouts } from '../src/data/workouts.js'
import { blankDraft, createHistoryEntry } from '../src/services/workoutSession.js'

test('blankDraft returns an independent empty workout draft', () => {
  const first = blankDraft()
  const second = blankDraft()
  first.entries.example = { done: true }

  assert.deepEqual(second, { startedAt: null, entries: {}, note: '' })
})

test('createHistoryEntry records completion, duration, and trimmed notes', () => {
  const workout = workouts.find((candidate) => candidate.id === 'conditioning')
  const draft = {
    startedAt: '2026-08-14T18:00:00.000Z',
    entries: {
      'c-row-warm': { done: true, result: '5 min' },
      'c-intervals': { done: true, result: '10 rounds' },
      'c-lunge': { done: false },
    },
    note: '  Strong intervals.  ',
  }

  const entry = createHistoryEntry(workout, draft, '2026-08-14T18:57:00.000Z')

  assert.equal(entry.id, 'conditioning-1786733820000')
  assert.equal(entry.durationMinutes, 57)
  assert.equal(entry.completed, 2)
  assert.equal(entry.total, 8)
  assert.equal(entry.note, 'Strong intervals.')
})
