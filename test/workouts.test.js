import assert from 'node:assert/strict'
import test from 'node:test'
import {
  equipment,
  scheduledWorkout,
  workoutItems,
  workouts,
} from '../src/data/workouts.js'

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

test('equipment lists the matching adjustable dumbbell pair', () => {
  assert.deepEqual(equipment[0], {
    name: 'Adjustable dumbbells',
    detail: 'Pair · 4–20 kg each · 2 kg increments',
  })
})

test('the revised program uses both dumbbells for paired movements', () => {
  const pairedItems = workouts
    .flatMap(workoutItems)
    .filter((item) => item.loadMode === 'each')

  assert.deepEqual(
    pairedItems.map((item) => item.id),
    [
      'a-dumbbell-floor-press',
      'a-bent-over-row',
      'a-two-dumbbell-rdl',
      'c-reverse-lunge',
      'c-dumbbell-press',
      'c-bent-over-row',
      'b-dumbbell-split-squat',
      'b-bent-over-row',
      'b-dumbbell-press',
      'b-simultaneous-curl',
    ],
  )
  assert.equal(
    pairedItems.some((item) => /one-arm|\/ arm|\/ side/i.test(`${item.name} ${item.target}`)),
    false,
  )
})
