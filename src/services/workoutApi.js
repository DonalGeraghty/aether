import { API_ENDPOINTS, authFetch } from '../config/api.js'

export class WorkoutApiError extends Error {
  constructor(message, status, code) {
    super(message)
    this.name = 'WorkoutApiError'
    this.status = status
    this.code = code
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
  }
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
