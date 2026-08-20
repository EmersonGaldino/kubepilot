import { useEffect } from 'react'

import { useResourceFocusStore, type ResourceFocusKind } from '@/stores/useResourceFocusStore'

/** Consumes a pending command-palette resource focus (see
 * `useResourceFocusStore` and `CommandPalette`) once the matching item shows
 * up in this page's freshly loaded list — auto-opening it exactly like a
 * manual row click would. The palette already set the namespace filter to
 * the item's namespace before navigating here, so a name match is enough. */
export function useResourceFocus<T>(kind: ResourceFocusKind, items: T[], getName: (item: T) => string, onOpen: (item: T) => void) {
  const focus = useResourceFocusStore((s) => s.focus)
  const clearFocus = useResourceFocusStore((s) => s.clearFocus)

  useEffect(() => {
    if (!focus || focus.kind !== kind) return
    const match = items.find((item) => getName(item) === focus.name)
    if (!match) return
    onOpen(match)
    clearFocus()
  }, [focus, items, kind, getName, onOpen, clearFocus])
}
