import clsx from 'clsx'
import { Check, ChevronDown, Search } from 'lucide-react'
import type { KeyboardEvent } from 'react'
import { useEffect, useMemo, useRef, useState } from 'react'

import { ALL_NAMESPACES } from '@/stores/useNamespaceStore'
import type { NamespaceSummary } from '@shared/types'

/** Lens-style namespace switcher: a single trigger showing the current
 * selection, opening a searchable dropdown — not a permanent list taking up
 * sidebar real estate. Used globally (Topbar), so every namespace-scoped
 * screen reacts to it automatically. */
export function NamespaceCombobox({
  namespaces,
  selected,
  onSelect,
}: {
  namespaces: NamespaceSummary[]
  selected: string
  onSelect: (namespace: string) => void
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)

  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const options = useMemo(() => {
    const all = [ALL_NAMESPACES, ...namespaces.map((ns) => ns.name)]
    if (!query.trim()) return all
    const q = query.trim().toLowerCase()
    return all.filter((name) => (name === ALL_NAMESPACES ? 'all namespaces'.includes(q) : name.toLowerCase().includes(q)))
  }, [namespaces, query])

  useEffect(() => {
    if (!open) return

    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  useEffect(() => {
    // Only imperative DOM focus here — query/activeIndex are reset
    // synchronously by `openDropdown` below, not in an effect, since they're
    // a direct response to the user's click rather than a sync-with-the-
    // outside-world concern.
    if (open) requestAnimationFrame(() => inputRef.current?.focus())
  }, [open])

  const openDropdown = () => {
    const allOptions = [ALL_NAMESPACES, ...namespaces.map((ns) => ns.name)]
    setQuery('')
    setActiveIndex(Math.max(allOptions.indexOf(selected), 0))
    setOpen(true)
  }

  const handleQueryChange = (value: string) => {
    setQuery(value)
    setActiveIndex(0)
  }

  const commit = (namespace: string) => {
    onSelect(namespace)
    setOpen(false)
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setActiveIndex((i) => Math.min(i + 1, options.length - 1))
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActiveIndex((i) => Math.max(i - 1, 0))
    } else if (event.key === 'Enter') {
      event.preventDefault()
      const choice = options[activeIndex]
      if (choice) commit(choice)
    } else if (event.key === 'Escape') {
      setOpen(false)
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => (open ? setOpen(false) : openDropdown())}
        className="flex min-h-8 items-center gap-1.5 rounded-md border border-border-subtle bg-surface-2 px-2.5 py-1 text-xs text-fg-muted transition-colors duration-150 hover:border-border-strong hover:bg-surface-3"
      >
        <span className="text-fg-subtle">Namespace</span>
        <span className="max-w-[10rem] truncate font-medium text-fg">
          {selected === ALL_NAMESPACES ? 'All namespaces' : selected}
        </span>
        <ChevronDown className="h-3.5 w-3.5 text-fg-subtle" />
      </button>

      {open && (
        <div
          className="absolute left-0 top-[calc(100%+6px)] z-50 w-64 overflow-hidden rounded-lg border border-border-strong bg-surface-1 opacity-100 shadow-panel"
          style={{ backgroundColor: '#11161e' }}
        >
          <div className="flex items-center gap-2 border-b border-border-subtle px-3 py-2">
            <Search className="h-3.5 w-3.5 shrink-0 text-fg-subtle" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => handleQueryChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search namespaces…"
              className="w-full bg-transparent text-sm text-fg placeholder:text-fg-subtle focus:outline-none"
            />
          </div>
          <div className="max-h-72 overflow-y-auto py-1">
            {options.length === 0 && <p className="px-3 py-3 text-xs text-fg-subtle">No namespaces match "{query}"</p>}
            {options.map((name, index) => (
              <button
                key={name}
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => commit(name)}
                className={clsx(
                  'flex min-h-8 w-full items-center justify-between px-3 py-1.5 text-left text-sm transition-colors duration-150',
                  index === activeIndex ? 'bg-accent-soft text-fg' : 'text-fg-muted hover:bg-surface-3 hover:text-fg',
                )}
              >
                <span className="truncate">{name === ALL_NAMESPACES ? 'All namespaces' : name}</span>
                {name === selected && <Check className="h-3.5 w-3.5 shrink-0 text-accent-hover" />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
