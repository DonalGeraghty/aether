export const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
export { HABIT_ICONS } from './habitIcons.js'
export const HABIT_COLOURS = ['#d9c5a3', '#a5c9ad', '#9bbad6', '#c2a5cf', '#d9a69b', '#b6c5cf']

export function dateInTimezone(timezone, now = new Date()) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(now)
}

export function shiftDate(date, days) {
  const value = new Date(`${date}T12:00:00Z`)
  value.setUTCDate(value.getUTCDate() + days)
  return value.toISOString().slice(0, 10)
}

export function scheduleOn(habit, date) {
  return [...habit.schedule_history].reverse().find((revision) => revision.effective_from <= date)
}

export function isDue(habit, date) {
  if (date < habit.start_date) return false
  const schedule = scheduleOn(habit, date)
  const weekday = (new Date(`${date}T12:00:00Z`).getUTCDay() + 6) % 7
  return Boolean(schedule && !schedule.archived && schedule.days.includes(weekday))
}

export function calendarDates(month) {
  const first = `${month}-01`
  const offset = (new Date(`${first}T12:00:00Z`).getUTCDay() + 6) % 7
  return Array.from({ length: 42 }, (_, index) => shiftDate(first, index - offset))
}

export function monthShift(month, amount) {
  const date = new Date(`${month}-01T12:00:00Z`)
  date.setUTCMonth(date.getUTCMonth() + amount)
  return date.toISOString().slice(0, 7)
}

export function checkinKey(habitId, date) { return `${habitId}:${date}` }

export function habitStats(habit, checkins, today) {
  let current = 0, best = 0, recent = 0, completeRecent = 0
  for (let date = habit.start_date; date <= today; date = shiftDate(date, 1)) {
    if (!isDue(habit, date)) continue
    const done = Boolean(checkins[checkinKey(habit.id, date)]?.completed)
    if (done) { current++; best = Math.max(best, current) }
    else if (date < today) current = 0
    if (date >= shiftDate(today, -29) && (date < today || done)) { recent++; if (done) completeRecent++ }
  }
  return { current, best, rate: recent ? Math.round(100 * completeRecent / recent) : 0 }
}
