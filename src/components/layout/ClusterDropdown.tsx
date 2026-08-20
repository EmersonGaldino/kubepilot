import clsx from 'clsx'
import { ChevronDown, Loader2 } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'

import { ProviderIcon } from '@/components/common/ProviderIcon'
import { SearchInput } from '@/components/ui/SearchInput'
import { useClusterPrefsStore } from '@/stores/useClusterPrefsStore'
import { useClusterStore } from '@/stores/useClusterStore'
import type { KubeContext } from '@shared/types'

import { ClusterCard } from './ClusterCard'

/** Cluster switcher for the Sidebar: a single trigger showing the active
 * context, opening a searchable dropdown instead of a permanent list — same
 * "lens" pattern as the Topbar's `NamespaceCombobox`, freeing the sidebar to
 * spend its height on navigation instead of every kubeconfig context. */
export function ClusterDropdown() {
  const contexts = useClusterStore((s) => s.contexts)
  const switchContext = useClusterStore((s) => s.switchContext)
  const infoStatus = useClusterStore((s) => s.infoStatus)

  const aliases = useClusterPrefsStore((s) => s.aliases)
  const favorites = useClusterPrefsStore((s) => s.favorites)
  const setAlias = useClusterPrefsStore((s) => s.setAlias)
  const toggleFavorite = useClusterPrefsStore((s) => s.toggleFavorite)

  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)

  const current = contexts.find((ctx) => ctx.isCurrent) ?? null

  const sortedContexts = useMemo(() => {
    return [...contexts].sort((a, b) => {
      const favDiff = (favorites[b.name] ? 1 : 0) - (favorites[a.name] ? 1 : 0)
      if (favDiff !== 0) return favDiff
      return (aliases[a.name] ?? a.name).localeCompare(aliases[b.name] ?? b.name)
    })
  }, [contexts, aliases, favorites])

  const visibleContexts = useMemo(() => {
    const needle = query.trim().toLowerCase()
    if (!needle) return sortedContexts
    return sortedContexts.filter((ctx) => {
      const alias = aliases[ctx.name]
      return ctx.name.toLowerCase().includes(needle) || (alias?.toLowerCase().includes(needle) ?? false)
    })
  }, [sortedContexts, query, aliases])

  useEffect(() => {
    if (!open) return
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  const openDropdown = () => {
    setQuery('')
    setOpen(true)
  }

  const handleSelect = (context: KubeContext) => {
    void switchContext(context.name)
    setOpen(false)
  }

  const displayName = current ? (aliases[current.name] ?? current.name) : null

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => (open ? setOpen(false) : openDropdown())}
        className="flex min-h-9 w-full items-center gap-2 rounded-md border border-border-subtle bg-surface-2 px-2.5 py-1.5 text-left text-sm transition-colors duration-150 hover:border-border-strong hover:bg-surface-3"
      >
        {infoStatus === 'loading' ? (
          <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-accent-hover" />
        ) : current ? (
          <ProviderIcon provider={current.provider} />
        ) : null}

        <span className="min-w-0 flex-1 truncate font-medium text-fg">
          {displayName ?? (contexts.length === 0 ? 'No contexts found' : 'Select a cluster')}
        </span>
        <ChevronDown className={clsx('h-3.5 w-3.5 shrink-0 text-fg-subtle transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <div className="absolute left-0 top-[calc(100%+6px)] z-30 w-full overflow-hidden rounded-lg border border-border-subtle bg-surface-2 shadow-panel">
          {contexts.length > 4 && (
            <div className="border-b border-border-subtle p-2">
              <SearchInput value={query} onValueChange={setQuery} placeholder="Filter clusters…" />
            </div>
          )}

          <div className="max-h-80 space-y-1 overflow-y-auto p-1.5">
            {contexts.length === 0 && <p className="px-2.5 py-2 text-xs text-fg-subtle">No contexts found</p>}
            {contexts.length > 0 && visibleContexts.length === 0 && (
              <p className="px-2.5 py-2 text-xs text-fg-subtle">No clusters match “{query.trim()}”</p>
            )}
            {visibleContexts.map((ctx) => (
              <ClusterCard
                key={ctx.name}
                context={ctx}
                alias={aliases[ctx.name] ?? null}
                favorite={Boolean(favorites[ctx.name])}
                switching={ctx.isCurrent && infoStatus === 'loading'}
                onSelect={() => handleSelect(ctx)}
                onToggleFavorite={() => toggleFavorite(ctx.name)}
                onRename={(alias) => setAlias(ctx.name, alias)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
