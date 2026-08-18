export const equipment = [
  { name: 'Adjustable dumbbells', detail: 'Pair · 4–20 kg each · 2 kg increments' },
  { name: 'Push-up grips', detail: 'For a comfortable, deeper range' },
  { name: 'DOMYOS Essential 120', detail: 'Rowing machine' },
]

export const dumbbellWeights = [4, 6, 8, 10, 12, 14, 16, 18, 20]

export const workouts = [
  {
    id: 'strength-a',
    day: 'Monday',
    shortDay: 'Mon',
    title: 'Full-Body Strength A',
    focus: 'Squat · push · pull · hinge · core',
    duration: 60,
    accent: 'Strength',
    blocks: [
      {
        title: 'Warm-up',
        range: '0:00–5:00',
        items: [
          { id: 'a-row-warm', name: 'Easy rowing', target: '5 min', detail: 'Start gently and gradually build the pace.', kind: 'cardio' },
        ],
      },
      {
        title: 'Main strength',
        range: '5:00–35:00',
        note: '3 sets each · rest 45–90 sec',
        items: [
          { id: 'a-goblet', name: 'Goblet squat', target: '3 × 8–12', kind: 'weight' },
          { id: 'a-dumbbell-floor-press', name: 'Dumbbell floor press', target: '3 × 8–12', kind: 'weight', loadMode: 'each' },
          { id: 'a-bent-over-row', name: 'Bent-over dumbbell row', target: '3 × 10–15', kind: 'weight', loadMode: 'each' },
          { id: 'a-two-dumbbell-rdl', name: 'Two-dumbbell Romanian deadlift', target: '3 × 10–15', kind: 'weight', loadMode: 'each' },
        ],
      },
      {
        title: 'Push + core',
        range: '35:00–45:00',
        note: '2–3 rounds · stop 1–2 reps before failure',
        items: [
          { id: 'a-pushup', name: 'Push-ups using grips', target: '8–15 reps', kind: 'reps' },
          { id: 'a-plank', name: 'Plank', target: '30–60 sec', kind: 'time' },
        ],
      },
      {
        title: 'Finish',
        range: '45:00–60:00',
        items: [
          { id: 'a-row-steady', name: 'Steady rowing', target: '12 min', detail: 'Easy-to-moderate, sustainable pace.', kind: 'cardio' },
          { id: 'a-cooldown', name: 'Cooldown', target: '3 min', detail: 'Very easy rowing or walking.', kind: 'cardio' },
        ],
      },
    ],
  },
  {
    id: 'conditioning',
    day: 'Wednesday',
    shortDay: 'Wed',
    title: 'Conditioning + Full Body',
    focus: 'Intervals · full-body circuit · recovery',
    duration: 60,
    accent: 'Conditioning',
    blocks: [
      {
        title: 'Warm-up',
        range: '0:00–5:00',
        items: [
          { id: 'c-row-warm', name: 'Easy rowing', target: '5 min', detail: 'Gradually build the pace.', kind: 'cardio' },
        ],
      },
      {
        title: 'Rowing intervals',
        range: '5:00–25:00',
        note: 'Hard should be repeatable—not an all-out sprint',
        items: [
          { id: 'c-intervals', name: 'Hard / easy intervals', target: '10 × 1 min / 1 min', detail: 'One minute hard, one minute easy.', kind: 'cardio' },
        ],
      },
      {
        title: 'Strength circuit',
        range: '25:00–50:00',
        note: '3 rounds · rest 60–90 sec between rounds',
        items: [
          { id: 'c-reverse-lunge', name: 'Reverse lunge with dumbbells', target: '8–10 / leg', kind: 'weight', loadMode: 'each' },
          { id: 'c-pushup', name: 'Push-ups using grips', target: '8–15 reps', kind: 'reps' },
          { id: 'c-dumbbell-press', name: 'Dumbbell overhead press', target: '8–12 reps', kind: 'weight', loadMode: 'each' },
          { id: 'c-bent-over-row', name: 'Bent-over dumbbell row', target: '10–15 reps', kind: 'weight', loadMode: 'each' },
        ],
      },
      {
        title: 'Recover',
        range: '50:00–60:00',
        items: [
          { id: 'c-row-easy', name: 'Easy rowing', target: '7 min', detail: 'Recovery pace.', kind: 'cardio' },
          { id: 'c-cooldown', name: 'Cooldown', target: '3 min', detail: 'Easy rowing or walking. Relax the shoulders.', kind: 'cardio' },
        ],
      },
    ],
  },
  {
    id: 'strength-b',
    day: 'Friday',
    shortDay: 'Fri',
    title: 'Full-Body Strength B',
    focus: 'Single-leg · push · pull · shoulders · arms',
    duration: 60,
    accent: 'Strength',
    blocks: [
      {
        title: 'Warm-up',
        range: '0:00–5:00',
        items: [
          { id: 'b-row-warm', name: 'Easy rowing', target: '5 min', kind: 'cardio' },
        ],
      },
      {
        title: 'Main strength',
        range: '5:00–35:00',
        note: '3 sets each · rest 45–90 sec',
        items: [
          { id: 'b-dumbbell-split-squat', name: 'Split squat with dumbbells', target: '3 × 8–12 / leg', kind: 'weight', loadMode: 'each' },
          { id: 'b-pushup', name: 'Push-ups using grips', target: '3 × 8–15', kind: 'reps' },
          { id: 'b-single-rdl', name: 'Single-leg Romanian deadlift', target: '3 × 8–12 / leg', kind: 'weight' },
          { id: 'b-bent-over-row', name: 'Bent-over dumbbell row', target: '3 × 10–15', kind: 'weight', loadMode: 'each' },
        ],
      },
      {
        title: 'Shoulders + arms + core',
        range: '35:00–47:00',
        note: '2 rounds · keep the block moving',
        items: [
          { id: 'b-dumbbell-press', name: 'Dumbbell overhead press', target: '8–12 reps', kind: 'weight', loadMode: 'each' },
          { id: 'b-simultaneous-curl', name: 'Simultaneous dumbbell curl', target: '10–15 reps', kind: 'weight', loadMode: 'each' },
          { id: 'b-triceps', name: 'Overhead triceps extension', target: '10–15 reps', kind: 'weight' },
          { id: 'b-suitcase', name: 'Suitcase hold or carry', target: '30–60 sec / side', kind: 'weight' },
        ],
      },
      {
        title: 'Finish',
        range: '47:00–60:00',
        items: [
          { id: 'b-row-steady', name: 'Steady rowing', target: '10 min', detail: 'Easy-to-moderate pace.', kind: 'cardio' },
          { id: 'b-cooldown', name: 'Cooldown', target: '3 min', detail: 'Very easy rowing or walking.', kind: 'cardio' },
        ],
      },
    ],
  },
]

export const workoutItems = (workout) => workout.blocks.flatMap((block) => block.items)

export function scheduledWorkout(date = new Date()) {
  const day = date.getDay()
  const exact = { 1: 'strength-a', 3: 'conditioning', 5: 'strength-b' }[day]
  if (exact) return workouts.find((workout) => workout.id === exact)

  const daysAhead = workouts.map((workout) => {
    const workoutDay = { Monday: 1, Wednesday: 3, Friday: 5 }[workout.day]
    return { workout, distance: (workoutDay - day + 7) % 7 }
  })

  return daysAhead.sort((a, b) => a.distance - b.distance)[0].workout
}
