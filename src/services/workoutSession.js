import { workoutItems } from '../data/workouts.js'

export function blankDraft() {
  return { startedAt: null, entries: {}, note: '' }
}

export function createHistoryEntry(workout, draft, finishedAt = new Date().toISOString()) {
  const items = workoutItems(workout)
  const completed = items.filter((item) => draft.entries[item.id]?.done)
  const durationMinutes = draft.startedAt
    ? Math.max(1, Math.round((new Date(finishedAt) - new Date(draft.startedAt)) / 60000))
    : workout.duration

  return {
    id: `${workout.id}-${new Date(finishedAt).getTime()}`,
    workoutId: workout.id,
    title: workout.title,
    day: workout.day,
    finishedAt,
    durationMinutes,
    completed: completed.length,
    total: items.length,
    entries: draft.entries,
    note: draft.note.trim(),
  }
}
