import test from 'node:test'
import assert from 'node:assert/strict'
import { createHoldGesture } from '../src/services/holdButtonGesture.js'

function clock() {
  let time = 0, id = 0
  const frames = new Map(), timers = new Map()
  const scheduler = {
    now: () => time,
    frame: (callback) => { frames.set(++id, callback); return id },
    cancelFrame: (key) => frames.delete(key),
    timeout: (callback, delay) => { timers.set(++id, { at: time + delay, callback }); return id },
    clearTimeout: (key) => timers.delete(key),
  }
  const advance = (delay) => {
    const target = time + delay
    while (true) {
      const pending = [...timers.entries()].filter(([, timer]) => timer.at <= target).sort((a, b) => a[1].at - b[1].at)[0]
      if (!pending) break
      time = pending[1].at; timers.delete(pending[0]); pending[1].callback()
    }
    time = target
    const pendingFrames = [...frames.values()]; frames.clear()
    for (const callback of pendingFrames) callback(time)
  }
  return { scheduler, advance }
}

const flush = async () => { await Promise.resolve(); await Promise.resolve() }

test('full hold saves exactly once and waits for persistence before showing done', async () => {
  const timer = clock(), phases = []
  let calls = 0, resolve
  const saved = new Promise((done) => { resolve = done })
  const gesture = createHoldGesture({ holdTime: 900, resetAfter: 0, onPhase: (phase) => phases.push(phase), onHold: () => { calls++; return saved } }, timer.scheduler)
  assert.equal(gesture.begin('pointer'), true)
  timer.advance(899)
  assert.equal(calls, 0)
  timer.advance(1)
  assert.equal(calls, 1)
  assert.equal(gesture.phase(), 'saving')
  assert.equal(gesture.begin('pointer'), false)
  gesture.release()
  timer.advance(500)
  assert.equal(calls, 1)
  resolve(); await flush()
  assert.equal(gesture.phase(), 'done')
  timer.advance(10000)
  assert.equal(gesture.phase(), 'done')
  assert.deepEqual(phases, ['holding', 'saving', 'done'])
  gesture.destroy()
})

test('early release and drifting away cancel without saving or a delayed completion', async () => {
  for (const drifted of [false, true]) {
    const timer = clock()
    let calls = 0, taps = 0
    const gesture = createHoldGesture({ holdTime: 900, onHold: () => calls++, onTap: () => taps++ }, timer.scheduler)
    gesture.begin('pointer'); timer.advance(100); gesture.release(drifted)
    timer.advance(2000); await flush()
    assert.equal(calls, 0)
    assert.equal(gesture.phase(), 'idle')
    assert.equal(taps, drifted ? 0 : 1)
    gesture.destroy()
  }
})

test('failed persistence returns to idle and allows retry', async () => {
  const timer = clock()
  let shouldFail = true, error
  const gesture = createHoldGesture({ holdTime: 900, resetAfter: 0,
    onHold: async () => { if (shouldFail) throw new Error('Offline') }, onError: (failure) => { error = failure } }, timer.scheduler)
  gesture.begin('key'); timer.advance(900); await flush()
  assert.equal(gesture.phase(), 'idle')
  assert.equal(error.message, 'Offline')
  timer.advance(200)
  shouldFail = false
  assert.equal(gesture.begin('key'), true)
  timer.advance(900); await flush()
  assert.equal(gesture.phase(), 'done')
  gesture.destroy()
})

test('disabled controls and destruction cancel active holds', async () => {
  const timer = clock()
  let calls = 0
  const gesture = createHoldGesture({ holdTime: 900, onHold: () => calls++ }, timer.scheduler)
  gesture.begin('pointer'); timer.advance(300); gesture.update({ disabled: true })
  timer.advance(1000); await flush()
  assert.equal(calls, 0)
  assert.equal(gesture.begin('key'), false)
  gesture.update({ disabled: false }); gesture.begin('key'); gesture.destroy()
  timer.advance(2000); await flush()
  assert.equal(calls, 0)
})

test('stored completions stay filled and undo follows confirmed state', async () => {
  const timer = clock()
  let taps = 0, progress
  const gesture = createHoldGesture({ completed: true, resetAfter: 0, onTap: () => taps++, onProgress: (value) => { progress = value } }, timer.scheduler)
  assert.equal(gesture.phase(), 'done')
  assert.equal(progress, 1)
  assert.equal(gesture.begin('pointer'), false)
  gesture.tap(); await flush()
  assert.equal(taps, 1)
  assert.equal(gesture.phase(), 'done')
  gesture.update({ completed: false })
  assert.equal(gesture.phase(), 'idle')
  assert.equal(progress, 0)
  gesture.destroy()
})

test('pending callbacks do not update an unmounted button', async () => {
  const timer = clock(), phases = []
  let resolve
  const gesture = createHoldGesture({ holdTime: 900, onPhase: (phase) => phases.push(phase), onHold: () => new Promise((done) => { resolve = done }) }, timer.scheduler)
  gesture.begin('pointer'); timer.advance(900)
  gesture.destroy(); resolve(); await flush(); timer.advance(5000)
  assert.deepEqual(phases, ['holding', 'saving'])
})
