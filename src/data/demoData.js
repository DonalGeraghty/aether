import { workoutItems, workouts } from './workouts.js'

const daysAgo = (days, hour = 18) => {
  const date = new Date()
  date.setDate(date.getDate() - days)
  date.setHours(hour, 20, 0, 0)
  return date.toISOString()
}

const workoutSnapshot = (workoutId) => {
  const workout = workouts.find((candidate) => candidate.id === workoutId)
  if (!workout) throw new Error(`Unknown demo workout: ${workoutId}`)
  return {
    workoutId,
    title: workout.title,
    day: workout.day,
    total: workoutItems(workout).length,
  }
}

export function createDemoHistory() {
  return [
    {
      ...workoutSnapshot('strength-a'),
      id: 'demo-strength-a-latest',
      finishedAt: daysAgo(4),
      durationMinutes: 58,
      completed: 9,
      entries: {
        'a-goblet': { done: true, weight: '16', result: '12, 12, 11' },
        'a-floor-press': { done: true, weight: '14', result: '10, 10, 9' },
        'a-row': { done: true, weight: '18', result: '12, 12, 12' },
        'a-rdl': { done: true, weight: '20', result: '12, 12, 12' },
      },
      note: 'Good energy. Move the floor press to 11 reps next week.',
    },
    {
      ...workoutSnapshot('strength-b'),
      id: 'demo-strength-b-previous',
      finishedAt: daysAgo(7),
      durationMinutes: 62,
      completed: 11,
      entries: {
        'b-split-squat': { done: true, weight: '12', result: '10, 10, 10' },
        'b-row': { done: true, weight: '18', result: '12, 12, 11' },
        'b-press': { done: true, weight: '10', result: '10, 9' },
      },
      note: 'Balance felt better on the single-leg RDL.',
    },
    {
      ...workoutSnapshot('conditioning'),
      id: 'demo-conditioning-previous',
      finishedAt: daysAgo(9),
      durationMinutes: 57,
      completed: 8,
      entries: {
        'c-intervals': { done: true, result: '10 rounds · steady' },
        'c-lunge': { done: true, weight: '12', result: '10 / leg' },
        'c-press': { done: true, weight: '10', result: '10 / arm' },
      },
      note: 'Held the same rowing pace across all ten intervals.',
    },
    {
      ...workoutSnapshot('strength-a'),
      id: 'demo-strength-a-previous',
      finishedAt: daysAgo(11),
      durationMinutes: 55,
      completed: 8,
      entries: {
        'a-goblet': { done: true, weight: '16', result: '10, 10, 10' },
        'a-floor-press': { done: true, weight: '14', result: '9, 9, 8' },
      },
      note: 'Shortened the steady row but kept the appointment.',
    },
    {
      ...workoutSnapshot('strength-b'),
      id: 'demo-first-session',
      finishedAt: daysAgo(14),
      durationMinutes: 60,
      completed: 10,
      entries: {
        'b-split-squat': { done: true, weight: '10', result: '8, 8, 8' },
        'b-row': { done: true, weight: '16', result: '10, 10, 10' },
      },
      note: 'Conservative first session. Plenty left in reserve.',
    },
  ]
}

export function createDemoDrafts(workoutId) {
  const entriesByWorkout = {
    'strength-a': {
      'a-row-warm': { done: true, result: 'Easy · 5 min' },
      'a-goblet': { done: true, weight: '16', result: '12, 12, 12' },
      'a-floor-press': { done: true, weight: '14', result: '11, 10, 10' },
    },
    conditioning: {
      'c-row-warm': { done: true, result: 'Easy · 5 min' },
      'c-intervals': { done: true, result: '10 rounds · 2:18 avg' },
      'c-lunge': { done: true, weight: '12', result: '10 / leg' },
    },
    'strength-b': {
      'b-row-warm': { done: true, result: 'Easy · 5 min' },
      'b-split-squat': { done: true, weight: '12', result: '10, 10, 10' },
      'b-pushup': { done: true, result: '14, 12, 11' },
    },
  }

  return {
    [workoutId]: {
      startedAt: null,
      entries: entriesByWorkout[workoutId] || {},
      note: 'Demo workout — continue logging from here.',
    },
  }
}
