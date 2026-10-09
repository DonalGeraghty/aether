// React Bits HoldButton gesture, adapted to await persistence before showing done.
export function createHoldGesture(initial, scheduler = {
  now: () => performance.now(),
  frame: (callback) => requestAnimationFrame(callback),
  cancelFrame: (id) => cancelAnimationFrame(id),
  timeout: (callback, delay) => setTimeout(callback, delay),
  clearTimeout: (id) => clearTimeout(id),
}) {
  let options = { holdTime: 2000, releaseTime: 200, resetAfter: 1200, disabled: false, completed: false, ...initial }
  let phase = options.completed ? 'done' : 'idle'
  let input = null, progress = options.completed ? 1 : 0, started = 0
  let frame = 0, completeTimer = 0, resetTimer = 0, alive = true, version = 0

  function setPhase(next, kind = null) {
    phase = next; input = kind
    options.onPhase?.(phase, input)
  }
  function setProgress(value) { progress = value; options.onProgress?.(value) }
  function clearTimers() {
    scheduler.clearTimeout(completeTimer); scheduler.clearTimeout(resetTimer)
    completeTimer = resetTimer = 0
  }
  function drive(target, duration, easing) {
    scheduler.cancelFrame(frame)
    const from = progress, start = scheduler.now()
    function step(now) {
      if (!alive) return
      const amount = duration > 0 ? Math.min(1, (now - start) / duration) : 1
      setProgress(from + (target - from) * easing(amount))
      if (amount < 1) frame = scheduler.frame(step)
      else {
        frame = 0
        if (target === 1) confirm()
      }
    }
    frame = scheduler.frame(step)
  }
  async function confirm() {
    if (!alive || options.disabled || phase !== 'holding' || scheduler.now() - started < options.holdTime - 50) return
    clearTimers(); scheduler.cancelFrame(frame); frame = 0
    const operation = ++version
    setProgress(1)
    setPhase('saving', input)
    try {
      await options.onHold?.()
      if (!alive || operation !== version) return
      setPhase('done', input)
      if (options.resetAfter > 0) resetTimer = scheduler.timeout(() => {
        setPhase('idle'); drive(0, options.releaseTime, (value) => 1 - (1 - value) ** 3)
      }, options.resetAfter)
    } catch (error) {
      if (!alive || operation !== version) return
      setPhase(options.completed ? 'done' : 'idle')
      drive(options.completed ? 1 : 0, options.releaseTime, (value) => 1 - (1 - value) ** 3)
      options.onError?.(error)
    }
  }
  function begin(kind) {
    if (!alive || options.disabled || phase !== 'idle') return false
    started = scheduler.now()
    setPhase('holding', kind)
    drive(1, options.holdTime, (value) => value)
    completeTimer = scheduler.timeout(confirm, options.holdTime + 100)
    return true
  }
  function release(drifted = false) {
    if (!alive || phase !== 'holding') return
    clearTimers()
    const held = scheduler.now() - started
    setPhase('idle')
    drive(0, options.releaseTime, (value) => 1 - (1 - value) ** 3)
    if (!drifted && held < 250) tap()
  }
  function tap() {
    if (!alive || options.disabled) return
    Promise.resolve().then(() => options.onTap?.()).catch((error) => { if (alive) options.onError?.(error) })
  }
  function update(next) {
    const previous = options
    options = { ...options, ...next }
    if (options.completed !== previous.completed) {
      clearTimers(); scheduler.cancelFrame(frame); frame = 0
      setPhase(options.completed ? 'done' : 'idle')
      setProgress(options.completed ? 1 : 0)
    } else if (options.disabled && phase === 'holding') release(true)
  }
  function destroy() { alive = false; version++; clearTimers(); scheduler.cancelFrame(frame) }
  setProgress(progress)
  return { begin, release, tap, update, destroy, phase: () => phase, input: () => input }
}
