import { API_ENDPOINTS, authFetch } from '../config/api.js'

export class WorkoutApiError extends Error {
  constructor(message, status, code, metadata = {}) {
    super(message)
    this.name = 'WorkoutApiError'
    this.status = status
    this.code = code
    this.provider = metadata.provider
    this.model = metadata.model
    this.details = metadata.details
  }
}

async function workoutRequest(path, options) {
  const response = await authFetch(path, options)
  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new WorkoutApiError(
      data.error || 'Workout history request failed',
      response.status,
      data.error,
      data,
    )
  }
  return data
}

function workoutPath(entryId) {
  const id = String(entryId || '').trim()
  if (!id) throw new Error('Workout entry ID is required')
  return `${API_ENDPOINTS.WORKOUTS}/${encodeURIComponent(id)}`
}

function fromApiEntry(entry) {
  return {
    id: entry.id,
    workoutId: entry.workout_id,
    title: entry.title,
    day: entry.day,
    finishedAt: entry.finished_at,
    durationMinutes: entry.duration_minutes,
    completed: entry.completed,
    total: entry.total,
    entries: entry.entries || {},
    note: entry.note || '',
    sourceMessage: entry.source_message || '',
    createdAt: entry.created_at,
    updatedAt: entry.updated_at,
  }
}

function toApiEntry(entry) {
  return {
    workout_id: entry.workoutId,
    title: entry.title,
    day: entry.day,
    finished_at: entry.finishedAt,
    duration_minutes: Number(entry.durationMinutes),
    completed: Number(entry.completed),
    total: Number(entry.total),
    entries: entry.entries || {},
    note: entry.note || '',
    source_message: entry.sourceMessage || null,
  }
}

function exerciseResult(exercise) {
  return [
    exercise.sets ? `${exercise.sets} ${exercise.sets === 1 ? 'set' : 'sets'}` : '',
    exercise.reps || '',
    exercise.duration || '',
    exercise.distance || '',
    exercise.notes || '',
  ].filter(Boolean).join(' · ').slice(0, 200)
}

export function createAIWorkoutHistoryEntry(
  analysis,
  sourceMessage,
  finishedAt = new Date().toISOString(),
) {
  const exercises = Array.isArray(analysis?.exercises) ? analysis.exercises : []
  if (!exercises.length) throw new Error('At least one exercise is required')
  const finished = new Date(finishedAt)
  if (Number.isNaN(finished.getTime())) throw new Error('A valid finish time is required')

  return {
    id: `ai-workout-${finished.getTime()}`,
    workoutId: 'ai-workout',
    title: analysis.title,
    day: new Intl.DateTimeFormat('en', { weekday: 'long' }).format(finished),
    finishedAt: finished.toISOString(),
    durationMinutes: Number(analysis.duration_minutes),
    completed: exercises.length,
    total: exercises.length,
    entries: Object.fromEntries(exercises.map((exercise, index) => [
      `ai-exercise-${index + 1}`,
      {
        done: true,
        name: exercise.name,
        result: exerciseResult(exercise),
        weight: exercise.weight ? exercise.weight.slice(0, 32) : undefined,
      },
    ])),
    note: analysis.summary || '',
    sourceMessage: String(sourceMessage || '').trim(),
  }
}

export async function analyzeWorkout(message) {
  const data = await workoutRequest(API_ENDPOINTS.WORKOUTS_ANALYZE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message }),
  })
  return data.analysis
}

export async function listWorkoutHistory() {
  const data = await workoutRequest(API_ENDPOINTS.WORKOUTS, { method: 'GET' })
  return Array.isArray(data.entries) ? data.entries.map(fromApiEntry) : []
}

export async function saveWorkoutHistoryEntry(entry) {
  const data = await workoutRequest(workoutPath(entry.id), {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(toApiEntry(entry)),
  })
  return fromApiEntry(data.entry)
}

export async function deleteWorkoutHistoryEntry(entryId) {
  await workoutRequest(workoutPath(entryId), { method: 'DELETE' })
}
