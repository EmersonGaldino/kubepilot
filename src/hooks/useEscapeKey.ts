import { useEffect } from 'react'

/** Closes overlays (drawers, dialogs) on Escape. Nested dialogs should pass
 * `capture` so they run before a parent drawer and consume the key. */
export function useEscapeKey(onClose: () => void, enabled = true, capture = false) {
  useEffect(() => {
    if (!enabled) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      event.preventDefault()
      if (capture) event.stopPropagation()
      onClose()
    }

    window.addEventListener('keydown', handleKeyDown, { capture })
    return () => window.removeEventListener('keydown', handleKeyDown, { capture })
  }, [onClose, enabled, capture])
}

