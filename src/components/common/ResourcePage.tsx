import type { LucideIcon } from 'lucide-react'
import { useMemo, useState, type ReactNode } from 'react'

import { Button } from '@/components/ui/Button'
import { SearchInput } from '@/components/ui/SearchInput'
import { yamlStubFor } from '@/lib/yamlStubs'
import { useNamespaceStore } from '@/stores/useNamespaceStore'
import type { RequestStatus } from '@/types/ui'
import type { DescribableKind } from '@shared/types'

import { DescribeModal } from './DescribeModal'
import { EmptyState } from './EmptyState'
import { ErrorState } from './ErrorState'
import { SkeletonTableRows } from './Skeleton'

export function ResourcePage<T>({
  title,
  countNoun,
  items,
  getSearchText,
  status,
  error,
  onRetry,
  emptyIcon,
  emptyTitle,
  emptyDescription,
  searchPlaceholder,
  skeletonColumns = 6,
  toolbar,
  createKind,
  onCreated,
  children,
}: {
  title: string
  countNoun: string
  items: T[]
  getSearchText: (item: T) => string
  status: RequestStatus
  error: string | null
  onRetry: () => void
  emptyIcon: LucideIcon
  emptyTitle: string
  emptyDescription: string
  searchPlaceholder?: string
  skeletonColumns?: number
  toolbar?: ReactNode
  createKind?: DescribableKind
  onCreated?: () => void
  children: (filtered: T[]) => ReactNode
}) {
  const [query, setQuery] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const namespaceFilter = useNamespaceStore((s) => s.selected)

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    if (!needle) return items
    return items.filter((item) => getSearchText(item).toLowerCase().includes(needle))
  }, [items, query, getSearchText])

  const showingCount = query.trim() ? `${filtered.length} of ${items.length}` : String(items.length)

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="flex shrink-0 flex-wrap items-center gap-3 border-b border-border-subtle px-5 py-3">
        <div className="min-w-0 flex-1">
          <h1 className="text-base font-semibold tracking-tight text-fg">{title}</h1>
          <p className="text-xs text-fg-muted">
            {showingCount} {countNoun}
          </p>
        </div>
        {toolbar}
        {createKind && (
          <Button variant="primary" onClick={() => setCreateOpen(true)}>
            New YAML
          </Button>
        )}
        {status !== 'loading' && status !== 'error' && items.length > 0 && (
          <SearchInput
            value={query}
            onValueChange={setQuery}
            placeholder={searchPlaceholder ?? `Filter ${countNoun}…`}
            className="w-full sm:w-64"
          />
        )}
      </header>

      {status === 'error' && error && <ErrorState message={error} onRetry={onRetry} />}

      {status === 'loading' && <SkeletonTableRows rows={8} columns={skeletonColumns} />}

      {status !== 'error' && status !== 'loading' && items.length === 0 && (
        <EmptyState icon={emptyIcon} title={emptyTitle} description={emptyDescription} />
      )}

      {status !== 'loading' && items.length > 0 && filtered.length === 0 && (
        <EmptyState
          icon={emptyIcon}
          title={`No ${countNoun} match “${query.trim()}”`}
          description="Try a different name, namespace, or status."
        />
      )}

      {status !== 'loading' && filtered.length > 0 && <div className="kp-table-wrap">{children(filtered)}</div>}

      {createKind && (
        <DescribeModal
          open={createOpen}
          title={`New ${title} · YAML`}
          yaml={yamlStubFor(createKind, namespaceFilter)}
          loading={false}
          error={null}
          onClose={() => setCreateOpen(false)}
          onApplied={() => {
            setCreateOpen(false)
            onCreated?.()
          }}
          secretWarning={createKind === 'secret'}
          kind={createKind}
        />
      )}
    </div>
  )
}
