import assert from 'node:assert/strict'
import test from 'node:test'
import { scheduledWorkout, workoutItems, workouts } from '../src/data/workouts.js'

test('scheduledWorkout selects the workout assigned to the current day', () => {
  assert.equal(scheduledWorkout(new Date('2026-08-17T12:00:00')).id, 'strength-a')
  assert.equal(scheduledWorkout(new Date('2026-08-19T12:00:00')).id, 'conditioning')
  assert.equal(scheduledWorkout(new Date('2026-08-21T12:00:00')).id, 'strength-b')
})

test('scheduledWorkout selects the next workout on a rest day', () => {
  assert.equal(scheduledWorkout(new Date('2026-08-18T12:00:00')).id, 'conditioning')
  assert.equal(scheduledWorkout(new Date('2026-08-22T12:00:00')).id, 'strength-a')
})

test('workoutItems flattens every block without changing order', () => {
  const workout = workouts.find((candidate) => candidate.id === 'strength-a')
  const items = workoutItems(workout)

  assert.equal(items.length, 9)
  assert.equal(items[0].id, 'a-row-warm')
  assert.equal(items.at(-1).id, 'a-cooldown')
})
