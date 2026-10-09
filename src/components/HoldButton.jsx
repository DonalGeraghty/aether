// Adapted from the React Bits JavaScript + CSS source supplied by the user.
import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import { createHoldGesture } from '../services/holdButtonGesture.js'
import './HoldButton.css'

export default function HoldButton({
  children = 'Hold to confirm', doneLabel = 'Confirmed', pendingLabel = 'Saving…',
  icon = null, doneIcon = null, backgroundColor = '#27272a', fillColor = '#5227FF',
  textColor = '#f5f5f5', fillTextColor = '#ffffff', size = 'md', radius = 14,
  fillDirection = 'right', holdTime = 2000, releaseTime = 200, pressScale = 0.97,
  wave = true, waveAmplitude = 6, glow = true, resetAfter = 1200, disabled = false,
  completed = false, onHold, onTap, onError, className = '', ariaLabel,
}) {
  const [state, setState] = useState({ phase: completed ? 'done' : 'idle', input: null })
  const button = useRef(null)
  const controller = useRef(null)
  const gesture = useRef({ pointerId: null, done: false, rect: null, doneKey: false })
  const hintId = useId()

  useEffect(() => {
    const instance = createHoldGesture({
      onPhase: (phase, input) => setState({ phase, input }),
      onProgress: (progress) => button.current?.style.setProperty('--hb-p', progress.toFixed(4)),
    })
    controller.current = instance
    return () => { instance.destroy(); controller.current = null }
  }, [])
  useEffect(() => {
    controller.current?.update({ holdTime, releaseTime, resetAfter, disabled, completed, onHold, onTap, onError })
    if (disabled) { gesture.current.pointerId = null; gesture.current.done = false; gesture.current.doneKey = false }
  }, [holdTime, releaseTime, resetAfter, disabled, completed, onHold, onTap, onError])

  useLayoutEffect(() => {
    const element = button.current
    const measure = () => {
      element.style.setProperty('--hb-w', `${element.offsetWidth}px`)
      element.style.setProperty('--hb-h', `${element.offsetHeight}px`)
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(element)
    return () => observer.disconnect()
  }, [])
  useEffect(() => {
    const cancel = () => {
      gesture.current.pointerId = null; gesture.current.done = false; gesture.current.doneKey = false
      controller.current?.release(true)
    }
    const onVisibility = () => { if (document.hidden) cancel() }
    window.addEventListener('blur', cancel)
    document.addEventListener('visibilitychange', onVisibility)
    return () => { window.removeEventListener('blur', cancel); document.removeEventListener('visibilitychange', onVisibility) }
  }, [])

  const pointerDown = (event) => {
    if (disabled || event.button !== 0 || !event.isPrimary || gesture.current.pointerId !== null) return
    const done = controller.current?.phase() === 'done'
    if (!done && !controller.current?.begin('pointer')) return
    gesture.current = { ...gesture.current, pointerId: event.pointerId, done, rect: event.currentTarget.getBoundingClientRect() }
    event.preventDefault()
    event.currentTarget.focus()
    try { event.currentTarget.setPointerCapture(event.pointerId) } catch { /* Pointer capture may be unavailable. */ }
  }
  const endPointer = (event, drifted = false) => {
    if (event.pointerId !== gesture.current.pointerId) return
    const wasDone = gesture.current.done
    gesture.current.pointerId = null
    gesture.current.done = false
    try { if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId) } catch { /* Capture may already be released. */ }
    if (wasDone && !drifted) controller.current?.tap()
    else controller.current?.release(drifted)
  }
  const labels = <>
    <span className="hold-button__idle" aria-hidden={state.phase === 'done'}>
      {icon && <span className="hold-button__icon">{icon}</span>}{state.phase === 'saving' ? pendingLabel : children}
    </span>
    <span className="hold-button__done" aria-hidden={state.phase !== 'done'}>
      {doneIcon && <span className="hold-button__icon">{doneIcon}</span>}{doneLabel}
    </span>
  </>
  return <button ref={button} type="button" disabled={disabled || state.phase === 'saving'}
    className={`hold-button hold-button--${size}${className ? ` ${className}` : ''}`}
    data-phase={state.phase} data-input={state.input ?? undefined} data-direction={fillDirection === 'up' ? 'up' : 'right'}
    data-glow={glow ? 'true' : undefined} aria-describedby={hintId} aria-label={ariaLabel} aria-pressed={completed}
    style={{ '--hb-radius': `${radius}px`, '--hb-bg': backgroundColor, '--hb-fill': fillColor,
      '--hb-text': textColor, '--hb-fill-text': fillTextColor, '--hb-hold': `${holdTime}ms`, '--hb-cycles': holdTime / 1100,
      '--hb-release': `${releaseTime}ms`, '--hb-press': pressScale, '--hb-wave': `${wave ? waveAmplitude : 0}px` }}
    onPointerDown={pointerDown}
    onPointerMove={(event) => {
      if (event.pointerId !== gesture.current.pointerId) return
      const box = gesture.current.rect
      if (event.clientX < box.left - 10 || event.clientX > box.right + 10 || event.clientY < box.top - 10 || event.clientY > box.bottom + 10) endPointer(event, true)
    }}
    onPointerUp={(event) => endPointer(event)} onPointerCancel={(event) => endPointer(event, true)}
    onLostPointerCapture={(event) => endPointer(event, true)}
    onPointerLeave={(event) => { if (event.pointerType !== 'touch') endPointer(event, true) }}
    onBlur={() => { gesture.current.pointerId = null; gesture.current.done = false; gesture.current.doneKey = false; controller.current?.release(true) }}
    onKeyDown={(event) => {
      if (event.key === 'Escape') { gesture.current.doneKey = false; controller.current?.release(true); return }
      if (event.key === ' ' || event.key === 'Enter') {
        event.preventDefault()
        if (!event.repeat) {
          if (controller.current?.phase() === 'done') gesture.current.doneKey = true
          else controller.current?.begin('key')
        }
      }
    }}
    onKeyUp={(event) => {
      if (event.key !== ' ' && event.key !== 'Enter') return
      event.preventDefault()
      if (gesture.current.doneKey) { gesture.current.doneKey = false; controller.current?.tap() }
      else if (controller.current?.input() === 'key') controller.current.release()
    }}
    onClick={(event) => { if (event.detail === 0 && controller.current?.phase() === 'done') controller.current.tap() }}
    onContextMenu={(event) => event.preventDefault()}>
    <span className="hold-button__pulse" aria-hidden="true" />
    <span className="hold-button__label">{labels}</span>
    <span className="hold-button__clip" aria-hidden="true">
      <span className="hold-button__fill"><span className="hold-button__label hold-button__label--fill">{labels}</span></span>
      <span className="hold-button__crest" aria-hidden="true"><span className="hold-button__label hold-button__label--fill">{labels}</span></span>
    </span>
    <span id={hintId} className="hold-button__sr">{completed ? 'Select to undo completion.' : `Press and hold with your pointer, Enter, or Space for ${Math.round(holdTime / 100) / 10} seconds to complete.`}</span>
  </button>
}
