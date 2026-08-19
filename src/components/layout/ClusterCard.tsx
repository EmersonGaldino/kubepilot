import clsx from 'clsx'
import { Loader2, Pencil, Star } from 'lucide-react'
import { useState, type KeyboardEvent } from 'react'

import { ProviderIcon } from '@/components/common/ProviderIcon'
import { IconButton } from '@/components/ui/IconButton'
import type { KubeContext } from '@shared/types'

/** One cluster entry in the Sidebar's "Clusters" list. The name is a real
 * button so switching is keyboard-accessible; rename/favorite sit beside it
 * as sibling controls instead of nested buttons. */
export function ClusterCard({
  context,
  alias,
  favorite,
  switching,
  onSelect,
  onToggleFavorite,
  onRename,
}: {
  context: KubeContext
  alias: string | null
  favorite: boolean
  /** True while this card is the one the user just switched to and its
   * cluster info is still loading — swaps the status dot for a spinner so
   * the switch reads as "in progress" instead of silently doing nothing. */
  switching: boolean
  onSelect: () => void
  onToggleFavorite: () => void
  onRename: (alias: string | null) => void
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(alias ?? context.name)

  const startEditing = () => {
    setDraft(alias ?? context.name)
    setEditing(true)
  }

  const commit = () => {
    const trimmed = draft.trim()
    onRename(trimmed && trimmed !== context.name ? trimmed : null)
    setEditing(false)
  }

  const handleDraftKey = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') commit()
    if (event.key === 'Escape') setEditing(false)
  }

  const displayName = alias ?? context.name

  return (
    <div
      title={context.clusterName}
      className={clsx(
        'group flex items-center gap-2 rounded-lg border px-2 py-1.5 text-left text-sm transition-colors duration-150',
        context.isCurrent
          ? 'border-accent/35 bg-accent/10 text-fg'
          : 'border-transparent bg-transparent text-fg-muted hover:border-border-subtle hover:bg-white/[0.04] hover:text-fg',
      )}
    >
      {switching ? (
        <Loader2 className="h-3 w-3 shrink-0 animate-spin text-accent-hover" />
      ) : (
        <span
          className={clsx('h-1.5 w-1.5 shrink-0 rounded-full', context.isCurrent ? 'bg-success' : 'bg-fg-subtle/60')}
          aria-hidden="true"
        />
      )}
      <ProviderIcon provider={context.provider} />

      <div className="min-w-0 flex-1">
        {editing ? (
          <input
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={handleDraftKey}
            onBlur={commit}
            aria-label="Cluster display name"
            className="w-full rounded-md border border-border-subtle bg-surface-1 px-1.5 py-0.5 text-sm text-fg"
          />
        ) : (
          <button type="button" onClick={onSelect} className="block w-full min-w-0 text-left">
            <p className="truncate font-medium">{displayName}</p>
            {alias && <p className="truncate text-[11px] text-fg-subtle">{context.name}</p>}
          </button>
        )}
      </div>

      {!editing && (
        <IconButton
          label="Rename cluster"
          onClick={startEditing}
          className="h-7 w-7 opacity-0 group-focus-within:opacity-100 group-hover:opacity-100"
        >
          <Pencil className="h-3 w-3" />
        </IconButton>
      )}

      <IconButton
        label={favorite ? 'Remove from favorites' : 'Add to favorites'}
        onClick={onToggleFavorite}
        className={clsx(
          'h-7 w-7',
          favorite ? 'text-warning' : 'text-fg-subtle opacity-0 group-focus-within:opacity-100 group-hover:opacity-100',
        )}
      >
        <Star className={clsx('h-3.5 w-3.5', favorite && 'fill-current')} />
      </IconButton>
    </div>
  )
}
