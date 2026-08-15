import assert from 'node:assert/strict'
import test from 'node:test'
import { createAIWorkoutHistoryEntry } from '../src/services/workoutApi.js'

test('createAIWorkoutHistoryEntry maps reviewed AI analysis to Janus history', () => {
  const entry = createAIWorkoutHistoryEntry({
    title: 'Squats and rowing',
    summary: 'A strength session followed by a steady row.',
    duration_minutes: 45,
    exercises: [
      {
        name: 'Goblet squat',
        sets: 3,
        reps: '10 reps',
        weight: '20 kg',
      },
      {
        name: 'Rowing',
        duration: '24 minutes',
        distance: '5 km',
      },
    ],
  }, '  I did squats and rowing.  ', '2026-08-15T10:30:00.000Z')

  assert.equal(entry.id, 'ai-workout-1786789800000')
  assert.equal(entry.workoutId, 'ai-workout')
  assert.equal(entry.durationMinutes, 45)
  assert.equal(entry.completed, 2)
  assert.equal(entry.total, 2)
  assert.equal(entry.entries['ai-exercise-1'].name, 'Goblet squat')
  assert.equal(entry.entries['ai-exercise-1'].weight, '20 kg')
  assert.equal(entry.entries['ai-exercise-1'].result, '3 sets · 10 reps')
  assert.equal(entry.entries['ai-exercise-2'].result, '24 minutes · 5 km')
  assert.equal(entry.note, 'A strength session followed by a steady row.')
  assert.equal(entry.sourceMessage, 'I did squats and rowing.')
})

test('createAIWorkoutHistoryEntry rejects an analysis without exercises', () => {
  assert.throws(
    () => createAIWorkoutHistoryEntry({ title: 'Unknown', exercises: [] }, 'Worked out'),
    /At least one exercise is required/,
  )
})
