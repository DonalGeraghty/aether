import catalog from '../data/habitIcons.json' with { type: 'json' }

export const HABIT_ICON_CATALOG = catalog
export const HABIT_ICON_CATEGORIES = [...new Set(catalog.map((icon) => icon.category))]
export const HABIT_ICONS = catalog.map((icon) => icon.id)

export function findHabitIcons(query = '', category = '') {
  const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean)
  return catalog.filter((icon) => {
    if (category && icon.category !== category) return false
    const searchable = `${icon.id} ${icon.label} ${icon.category} ${icon.keywords}`.toLowerCase()
    return words.every((word) => searchable.includes(word))
  })
}
