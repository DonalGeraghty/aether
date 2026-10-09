import test from 'node:test'
import assert from 'node:assert/strict'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { HABIT_ICON_COMPONENTS } from '../src/data/habitIconComponents.js'
import { HABIT_ICON_CATALOG, HABIT_ICONS, findHabitIcons } from '../src/services/habitIcons.js'

test('every catalog icon renders an SVG and legacy habit IDs remain available', () => {
  assert.ok(HABIT_ICONS.length > 250)
  assert.equal(new Set(HABIT_ICONS).size, HABIT_ICONS.length)
  for (const icon of HABIT_ICON_CATALOG) {
    const markup = renderToStaticMarkup(createElement(HABIT_ICON_COMPONENTS[icon.id], { size: 24 }))
    assert.match(markup, /<svg/)
    assert.match(markup, /<(path|circle|rect|line|polyline|polygon|ellipse)/)
  }
  for (const id of ['check', 'book', 'walk', 'leaf', 'water', 'sun', 'moon', 'dumbbell', 'heart', 'plan']) assert.ok(HABIT_ICONS.includes(id))
})

test('search matches synonyms and words, respects categories, and handles no results', () => {
  assert.ok(findHabitIcons('reading').some((icon) => icon.id === 'book'))
  assert.ok(findHabitIcons('walking').some((icon) => icon.id === 'walk'))
  assert.ok(findHabitIcons('hydrate').some((icon) => icon.id === 'water'))
  assert.ok(findHabitIcons(' WAKE morning ').some((icon) => icon.id === 'alarm-clock'))
  assert.ok(findHabitIcons('', 'Food & drink').every((icon) => icon.category === 'Food & drink'))
  assert.deepEqual(findHabitIcons('reading', 'Food & drink'), [])
  assert.deepEqual(findHabitIcons('xyzzy-no-matching-icon'), [])
})
