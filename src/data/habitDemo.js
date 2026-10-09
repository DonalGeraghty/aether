import { checkinKey, dateInTimezone, habitStats, shiftDate } from '../services/habits.js'

export function createHabitDemo() {
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
  const today = dateInTimezone(timezone)
  const state = { timezone, categories: [{ id: 'health', name: 'Health', order: 0 }, { id: 'learning', name: 'Learning', order: 1 }], groups: [{ id: 'morning', name: 'Morning', order: 0 }, { id: 'evening', name: 'Evening', order: 1 }], stats: {}, habits: [] }
  state.habits = [['local-habit-demo-read', 'Read a little', 'book', '#d9c5a3', 'learning', 'evening'], ['walk', 'Get outside', 'walk', '#a5c9ad', 'health', 'morning'], ['stretch', 'Stretch', 'leaf', '#9bbad6', 'health', 'evening']].map(([id, name, icon, colour, category_id, group_id], order) => ({ id, name, icon, colour, category_id, group_id, order, description: '', archived: false, start_date: shiftDate(today, -12), days: [0, 1, 2, 3, 4, 5, 6], schedule_history: [{ effective_from: shiftDate(today, -12), days: [0, 1, 2, 3, 4, 5, 6], archived: false }] }))
  const checkins = {}
  for (let day = 1; day <= 12; day++) for (const habit of state.habits) {
    if (day !== 7 && !(habit.id === 'stretch' && day % 4 === 0)) {
      const date = shiftDate(today, -day)
      checkins[checkinKey(habit.id, date)] = { habit_id: habit.id, date, completed: true, note: '' }
    }
  }
  state.stats = Object.fromEntries(state.habits.map((habit) => [habit.id, habitStats(habit, checkins, today)]))
  return { state, checkins }
}

export function mutateHabitDemo(current, path, method, body) {
  const next = structuredClone(current), state = next.state
  const parts = path.split('/').filter(Boolean)
  const today = dateInTimezone(state.timezone)
  const id = parts[2]
  const collection = parts[1] === 'habit-categories' ? 'categories' : parts[1] === 'habit-groups' ? 'groups' : 'habits'
  if (parts[2] === 'settings') { dateInTimezone(body.timezone); state.timezone = body.timezone }
  else if (parts[3] === 'checkins') next.checkins[checkinKey(id, parts[4])] = { habit_id: id, date: parts[4], ...body }
  else if (method === 'DELETE') {
    state[collection] = state[collection].filter((item) => item.id !== id)
    if (collection === 'habits') for (const key of Object.keys(next.checkins)) { if (key.startsWith(`${id}:`)) delete next.checkins[key] }
    else state.habits.forEach((habit) => { if (habit[collection === 'categories' ? 'category_id' : 'group_id'] === id) habit[collection === 'categories' ? 'category_id' : 'group_id'] = null })
  } else if (method === 'POST') {
    const item = { ...body, id: crypto.randomUUID(), order: state[collection].length }
    if (collection === 'habits') Object.assign(item, { archived: false, schedule_history: [{ effective_from: body.start_date, days: body.days, archived: false }] })
    state[collection].push(item); next.result = { item, habit: item }
  } else {
    const item = state[collection].find((entry) => entry.id === id)
    if (!item) throw new Error('Not found')
    if (collection === 'habits' && ('days' in body || 'archived' in body)) {
      const effective_from = shiftDate(today, 1)
      const revision = { effective_from, days: body.days || item.days, archived: body.archived ?? item.archived }
      item.schedule_history = [...item.schedule_history.filter((entry) => entry.effective_from < effective_from), revision]
    }
    Object.assign(item, body)
    if ('order' in body) { state[collection] = state[collection].filter((entry) => entry.id !== id); state[collection].splice(body.order, 0, item) }
  }
  for (const field of ['habits', 'groups', 'categories']) state[field].forEach((item, index) => { item.order = index })
  state.stats = Object.fromEntries(state.habits.map((habit) => [habit.id, habitStats(habit, next.checkins, dateInTimezone(state.timezone))]))
  return next
}
