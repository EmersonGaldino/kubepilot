import { CircleDot, Search, TerminalSquare } from 'lucide-react'
import { useMemo, useState } from 'react'

import { PodPhaseBadge } from '@/components/common/StatusBadge'
import { SearchInput } from '@/components/ui/SearchInput'
import { ALL_NAMESPACES } from '@/stores/useNamespaceStore'
import type { PodSummary } from '@shared/types'

export function PodLogTargetPicker({
  pods,
  namespaceFilter,
  loading = false,
  onSelect,
}: {
  pods: PodSummary[]
  namespaceFilter: string
  loading?: boolean
  onSelect: (pod: PodSummary) => void
}) {
  const [query, setQuery] = useState('')
  const visiblePods = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return pods
      .filter((pod) => namespaceFilter === ALL_NAMESPACES || pod.namespace === namespaceFilter)
      .filter((pod) => !needle || `${pod.name} ${pod.namespace} ${pod.node ?? ''}`.toLowerCase().includes(needle))
      .sort((a, b) => a.namespace.localeCompare(b.namespace) || a.name.localeCompare(b.name))
  }, [namespaceFilter, pods, query])

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <div className="rounded-xl border border-accent/20 bg-accent/[0.06] p-4">
        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-accent/15 p-2.5 text-accent-hover">
            <TerminalSquare className="h-5 w-5" strokeWidth={1.7} />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-fg">Choose a pod to inspect</h2>
            <p className="mt-1 max-w-lg text-sm leading-relaxed text-fg-muted">
              Search by pod, namespace, or node. Container selection comes next when the pod has more than one container.
            </p>
          </div>
        </div>
      </div>

      <SearchInput value={query} onValueChange={setQuery} placeholder="Search pods, namespaces, or nodes…" className="w-full" autoFocus />

      <div className="min-h-0 overflow-y-auto rounded-xl border border-border-subtle bg-surface-1 p-1.5">
        {loading && <p className="px-3 py-5 text-sm text-fg-muted">Loading pods…</p>}
        {!loading && visiblePods.length === 0 && (
          <div className="px-3 py-8 text-center">
            <Search className="mx-auto h-5 w-5 text-fg-subtle" />
            <p className="mt-2 text-sm font-medium text-fg">No pods found</p>
            <p className="mt-1 text-xs text-fg-muted">Try another name, namespace, or clear the current namespace filter.</p>
          </div>
        )}
        {visiblePods.map((pod) => (
          <button
            key={`${pod.namespace}/${pod.name}`}
            type="button"
            onClick={() => onSelect(pod)}
            className="group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-white/[0.055] focus-visible:bg-white/[0.055]"
          >
            <CircleDot className="h-4 w-4 shrink-0 text-fg-subtle transition-colors group-hover:text-accent-hover" strokeWidth={1.7} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-fg">{pod.name}</p>
              <p className="mt-0.5 truncate text-xs text-fg-subtle">
                {pod.namespace}{pod.node ? ` · ${pod.node}` : ''}
              </p>
            </div>
            <div className="hidden items-center gap-2 sm:flex">
              {pod.restarts > 0 && <span className="text-xs tabular-nums text-fg-subtle">{pod.restarts} restarts</span>}
              <PodPhaseBadge phase={pod.phase} />
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
