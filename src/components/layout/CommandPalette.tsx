import clsx from 'clsx'
import { CornerDownLeft, LayoutGrid, Loader2, RotateCw, Search, Settings } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

import { useEscapeKey } from '@/hooks/useEscapeKey'
import { useFocusTrap } from '@/hooks/useFocusTrap'
import { ALL_NAV_ITEMS } from '@/lib/navigation'
import { refreshCurrentView } from '@/lib/refreshCurrentView'
import { iconForRoute, RESOURCE_SEARCH_KINDS } from '@/lib/resourceSearch'
import { useClusterPrefsStore } from '@/stores/useClusterPrefsStore'
import { useClusterStore } from '@/stores/useClusterStore'
import { useCommandPaletteStore } from '@/stores/useCommandPaletteStore'
import { useNamespaceStore } from '@/stores/useNamespaceStore'
import { useResourceFocusStore } from '@/stores/useResourceFocusStore'
import { useSettingsDrawerStore } from '@/stores/useSettingsDrawerStore'

// How long to wait after the last keystroke before hitting the cluster for
// matching resources — avoids firing a full pod/deployment/etc. list on
// every keystroke while the user is still typing a name.
const RESOURCE_SEARCH_DEBOUNCE_MS = 250
// Below this length a resource search is too unspecific (would return
// almost everything) and not worth the round-trip.
const RESOURCE_SEARCH_MIN_CHARS = 2
// Per-kind cap so one prolific resource kind (say, hundreds of pods) can't
// crowd out every other match in the list.
const RESOURCE_SEARCH_MAX_PER_KIND = 6

type PaletteItem = {
  id: string
  label: string
  group: string
  icon: typeof LayoutGrid
  keywords?: string
  run: () => void
}

/** Mounts the global ⌘K/Ctrl+K listener and, while open, renders a fresh
 * `CommandPalettePanel` instance (keyed so it remounts each time the
 * palette opens, which is what gives it a blank query/selection without
 * needing an effect to reset state on open). */
export function CommandPalette() {
  const open = useCommandPaletteStore((s) => s.open)
  const setOpen = useCommandPaletteStore((s) => s.setOpen)

  // Bumped whenever the palette transitions from closed to open, so keying
  // the panel on it forces a fresh mount (blank query/selection) without an
  // effect to reset state — the React-recommended "adjusting state during
  // render" pattern for resetting on a prop/store change.
  const [wasOpen, setWasOpen] = useState(open)
  const [instanceKey, setInstanceKey] = useState(0)
  if (open !== wasOpen) {
    setWasOpen(open)
    if (open) setInstanceKey((k) => k + 1)
  }

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        useCommandPaletteStore.getState().toggle()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  if (!open) return null
  return <CommandPalettePanel key={instanceKey} onClose={() => setOpen(false)} />
}

function CommandPalettePanel({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate()
  const location = useLocation()
  const selectedNamespace = useNamespaceStore((s) => s.selected)

  const contexts = useClusterStore((s) => s.contexts)
  const currentContext = useClusterStore((s) => s.currentContext)
  const switchContext = useClusterStore((s) => s.switchContext)
  const aliases = useClusterPrefsStore((s) => s.aliases)
  const toggleSettings = useSettingsDrawerStore((s) => s.toggle)
  const setResourceFocus = useResourceFocusStore((s) => s.setFocus)

  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)
  const [resourceItems, setResourceItems] = useState<PaletteItem[]>([])
  const [resourceSearching, setResourceSearching] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const dialogRef = useRef<HTMLDivElement>(null)

  useEscapeKey(onClose)
  useFocusTrap(dialogRef)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const items = useMemo<PaletteItem[]>(() => {
    const navItems: PaletteItem[] = ALL_NAV_ITEMS.map((link) => ({
      id: `nav:${link.to}`,
      label: link.label,
      group: link.group,
      icon: link.icon,
      run: () => navigate(link.to),
    }))

    const clusterItems: PaletteItem[] = contexts.map((ctx) => ({
      id: `cluster:${ctx.name}`,
      label: aliases[ctx.name] ?? ctx.name,
      group: 'Switch cluster',
      icon: LayoutGrid,
      keywords: ctx.name,
      run: () => void switchContext(ctx.name),
    }))

    const actionItems: PaletteItem[] = [
      {
        id: 'action:settings',
        label: 'Open Settings',
        group: 'Actions',
        icon: Settings,
        run: () => toggleSettings(),
      },
      {
        id: 'action:refresh',
        label: 'Refresh current view',
        group: 'Actions',
        icon: RotateCw,
        run: () => refreshCurrentView(location.pathname, selectedNamespace),
      },
    ]

    return [...navItems, ...clusterItems, ...actionItems]
  }, [contexts, aliases, switchContext, toggleSettings, navigate, location.pathname, selectedNamespace])

  const coreMatches = useMemo(() => {
    const needle = query.trim().toLowerCase()
    if (!needle) return items
    return items.filter((item) =>
      `${item.label} ${item.group} ${item.keywords ?? ''}`.toLowerCase().includes(needle),
    )
  }, [items, query])

  // Once inside a cluster, ⌘K also searches live resources by name — Pods,
  // Deployments, Services, etc. — not just the static page/action list.
  // Debounced, and only fired once the query is specific enough to matter.
  useEffect(() => {
    const needle = query.trim()
    if (!currentContext || needle.length < RESOURCE_SEARCH_MIN_CHARS) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- resetting to the "no query" state, not reacting to it
      setResourceItems([])
      setResourceSearching(false)
      return
    }

    setResourceSearching(true)
    const timer = setTimeout(async () => {
      const lower = needle.toLowerCase()
      const perKind = await Promise.allSettled(
        RESOURCE_SEARCH_KINDS.map(async (config) => {
          const all = await config.list()
          const icon = iconForRoute(config.route) ?? LayoutGrid
          return all
            .filter((item) => item.name.toLowerCase().includes(lower) || item.namespace.toLowerCase().includes(lower))
            .slice(0, RESOURCE_SEARCH_MAX_PER_KIND)
            .map<PaletteItem>((item) => ({
              id: `resource:${config.kind}:${item.namespace}/${item.name}`,
              label: item.name,
              group: config.label,
              icon,
              keywords: item.namespace,
              run: () => {
                useNamespaceStore.getState().select(item.namespace)
                setResourceFocus({ kind: config.kind, namespace: item.namespace, name: item.name })
                navigate(config.route)
              },
            }))
        }),
      )
      setResourceItems(perKind.flatMap((result) => (result.status === 'fulfilled' ? result.value : [])))
      setResourceSearching(false)
    }, RESOURCE_SEARCH_DEBOUNCE_MS)

    return () => clearTimeout(timer)
  }, [query, currentContext, navigate, setResourceFocus])

  const filtered = useMemo(() => [...coreMatches, ...resourceItems], [coreMatches, resourceItems])

  const runItem = (item: PaletteItem | undefined) => {
    if (!item) return
    item.run()
    onClose()
  }

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setActiveIndex((i) => Math.min(i + 1, filtered.length - 1))
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActiveIndex((i) => Math.max(i - 1, 0))
    } else if (event.key === 'Enter') {
      event.preventDefault()
      runItem(filtered[activeIndex])
    }
  }

  let lastGroup: string | null = null

  return (
    <div className="kp-palette-scrim" onClick={onClose} role="presentation">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
        className="kp-palette"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center gap-2.5 border-b border-border-subtle px-4 py-3">
          <Search className="h-4 w-4 shrink-0 text-fg-subtle" strokeWidth={1.75} />
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => {
              setQuery(event.target.value)
              setActiveIndex(0)
            }}
            onKeyDown={onKeyDown}
            placeholder="Jump to a page, cluster, resource, or action…"
            className="h-6 w-full bg-transparent text-sm text-fg placeholder:text-fg-subtle focus:outline-none"
          />
          {resourceSearching && <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-fg-subtle" />}
          <kbd className="shrink-0 rounded border border-border-subtle px-1.5 py-0.5 text-[10px] font-medium text-fg-subtle">
            esc
          </kbd>
        </div>

        <div className="max-h-96 overflow-y-auto p-1.5">
          {filtered.length === 0 && !resourceSearching && (
            <p className="px-3 py-6 text-center text-sm text-fg-subtle">No matches for “{query.trim()}”</p>
          )}
          {filtered.map((item, index) => {
            const showGroupLabel = item.group !== lastGroup
            lastGroup = item.group
            const Icon = item.icon
            return (
              <div key={item.id}>
                {showGroupLabel && (
                  <p className="px-2.5 pb-1 pt-2.5 text-[11px] font-semibold uppercase tracking-wider text-fg-subtle">
                    {item.group}
                  </p>
                )}
                <button
                  type="button"
                  onClick={() => runItem(item)}
                  onMouseEnter={() => setActiveIndex(index)}
                  className={clsx(
                    'flex min-h-8 w-full items-center gap-2.5 rounded-md px-2.5 py-1.5 text-left text-sm transition-colors duration-100',
                    index === activeIndex
                      ? 'bg-accent/15 text-blue-200'
                      : 'text-fg-muted hover:bg-white/[0.05] hover:text-fg',
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" strokeWidth={1.75} />
                  <span className="truncate">{item.label}</span>
                  {index === activeIndex && <CornerDownLeft className="ml-auto h-3.5 w-3.5 shrink-0 text-fg-subtle" />}
                </button>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
