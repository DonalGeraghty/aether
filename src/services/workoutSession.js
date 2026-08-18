import { workoutItems } from '../data/workouts.js'

export function blankDraft() {
  return { startedAt: null, entries: {}, note: '' }
}

export function previousExercisePerformance(history, workoutId) {
  const sessions = [...history]
    .filter((entry) => entry.workoutId === workoutId)
    .sort((left, right) => new Date(right.finishedAt) - new Date(left.finishedAt))
  const previous = {}

  for (const session of sessions) {
    for (const [exerciseId, entry] of Object.entries(session.entries || {})) {
      if (previous[exerciseId] || !entry?.done) continue
      const weight = String(entry.weight ?? '').trim()
      const result = String(entry.result ?? '').trim()
      if (!weight && !result) continue

      previous[exerciseId] = {
        finishedAt: session.finishedAt,
        weight,
        result,
      }
    }
  }

  return previous
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
