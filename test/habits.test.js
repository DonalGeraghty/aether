import test from 'node:test'
import assert from 'node:assert/strict'
import { calendarDates, dateInTimezone, habitStats, isDue, monthShift, shiftDate } from '../src/services/habits.js'

const habit = { start_date: '2026-10-01', schedule_history: [
  { effective_from: '2026-10-01', days: [0, 2, 4], archived: false },
  { effective_from: '2026-10-12', days: [1, 3], archived: false },
  { effective_from: '2026-10-20', days: [1, 3], archived: true },
] }

test('schedule changes preserve past weekdays and archive history', () => {
  assert.equal(isDue(habit, '2026-09-30'), false)
  assert.equal(isDue(habit, '2026-10-09'), true)
  assert.equal(isDue(habit, '2026-10-10'), false)
  assert.equal(isDue(habit, '2026-10-12'), false)
  assert.equal(isDue(habit, '2026-10-13'), true)
  assert.equal(isDue(habit, '2026-10-20'), false)
})

test('calendar grids start on Monday and include leap days and year boundaries', () => {
  const days = calendarDates('2024-02')
  assert.equal(days.length, 42)
  assert.equal(days[0], '2024-01-29')
  assert.ok(days.includes('2024-02-29'))
  assert.equal(monthShift('2026-12', 1), '2027-01')
  assert.equal(monthShift('2026-01', -1), '2025-12')
  assert.equal(shiftDate('2024-03-01', -1), '2024-02-29')
})

test('daily boundaries follow the account timezone across daylight saving', () => {
  const now = new Date('2026-10-09T23:30:00Z')
  assert.equal(dateInTimezone('Europe/Dublin', now), '2026-10-10')
  assert.equal(dateInTimezone('America/Los_Angeles', now), '2026-10-09')
  assert.equal(dateInTimezone('Europe/Dublin', new Date('2026-10-26T00:30:00Z')), '2026-10-26')
})

test('streaks skip rest days, preserve a pending today, and reset after a missed day', () => {
  const definition = { ...habit, id: 'read', start_date: '2026-10-05' }
  const entries = { 'read:2026-10-05': { completed: true }, 'read:2026-10-07': { completed: true } }
  assert.deepEqual(habitStats(definition, entries, '2026-10-09'), { current: 2, best: 2, rate: 100 })
  assert.deepEqual(habitStats(definition, entries, '2026-10-10'), { current: 0, best: 2, rate: 67 })
})
