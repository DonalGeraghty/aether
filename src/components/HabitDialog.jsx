import { useEffect, useRef } from 'react'

export default function HabitDialog({ label, busy, onClose, children }) {
  const dialog = useRef(null)
  useEffect(() => {
    const element = dialog.current
    const previous = document.activeElement
    element.showModal()
    return () => { element.close(); previous?.focus() }
  }, [])
  return <dialog ref={dialog} className="habit-dialog" aria-label={label}
    onCancel={(event) => { event.preventDefault(); if (!busy) onClose() }}
    onClick={(event) => {
      if (event.target !== event.currentTarget || busy) return
      const box = event.currentTarget.getBoundingClientRect()
      if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) onClose()
    }}>{children}</dialog>
}
