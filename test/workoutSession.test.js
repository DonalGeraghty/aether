import assert from 'node:assert/strict'
import test from 'node:test'
import { workouts } from '../src/data/workouts.js'
import {
  blankDraft,
  createHistoryEntry,
  previousExercisePerformance,
} from '../src/services/workoutSession.js'

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
      'c-reverse-lunge': { done: false },
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

test('previousExercisePerformance finds the newest completed result per exercise', () => {
  const history = [
    {
      workoutId: 'conditioning',
      finishedAt: '2026-08-12T18:00:00.000Z',
      entries: {
        'c-reverse-lunge': { done: true, weight: '12', result: '10 / leg' },
        'c-dumbbell-press': { done: true, weight: '10', result: '10 reps' },
      },
    },
    {
      workoutId: 'conditioning',
      finishedAt: '2026-08-19T18:00:00.000Z',
      entries: {
        'c-reverse-lunge': { done: false, weight: '14', result: '8 / leg' },
        'c-dumbbell-press': { done: true, weight: '12', result: '9 reps' },
        'c-bent-over-row': { done: true, weight: '', result: '' },
      },
    },
    {
      workoutId: 'strength-a',
      finishedAt: '2026-08-20T18:00:00.000Z',
      entries: {
        'c-dumbbell-press': { done: true, weight: '20', result: '12 reps' },
      },
    },
    {
      workoutId: 'conditioning',
      finishedAt: '2026-08-05T18:00:00.000Z',
      entries: {
        'c-bent-over-row': { done: true, weight: '16', result: '12 reps' },
      },
    },
  ]

  assert.deepEqual(previousExercisePerformance(history, 'conditioning'), {
    'c-dumbbell-press': {
      finishedAt: '2026-08-19T18:00:00.000Z',
      weight: '12',
      result: '9 reps',
    },
    'c-reverse-lunge': {
      finishedAt: '2026-08-12T18:00:00.000Z',
      weight: '12',
      result: '10 / leg',
    },
    'c-bent-over-row': {
      finishedAt: '2026-08-05T18:00:00.000Z',
      weight: '16',
      result: '12 reps',
    },
  })
})

test('previousExercisePerformance returns no result without matching history', () => {
  assert.deepEqual(previousExercisePerformance([], 'strength-a'), {})
  assert.deepEqual(previousExercisePerformance([
    {
      workoutId: 'ai-workout',
      finishedAt: '2026-08-20T18:00:00.000Z',
      entries: { 'a-goblet': { done: true, weight: '20', result: '12 reps' } },
    },
  ], 'strength-a'), {})
})
