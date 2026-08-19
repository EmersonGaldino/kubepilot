import clsx from 'clsx'
import { CalendarClock } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

import { ResourcePage } from '@/components/common/ResourcePage'
import { EventTable } from '@/components/events/EventTable'
import { useEventStore } from '@/stores/useEventStore'
import { useNamespaceStore } from '@/stores/useNamespaceStore'
import type { EventSummary, EventType } from '@shared/types'

function searchText(event: EventSummary) {
  return `${event.reason} ${event.message} ${event.namespace} ${event.involvedObjectKind} ${event.involvedObjectName} ${event.type}`
}

const TYPE_FILTERS: { id: 'all' | EventType; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'Warning', label: 'Warning' },
  { id: 'Normal', label: 'Normal' },
]

export function Events() {
  const events = useEventStore((s) => s.events)
  const status = useEventStore((s) => s.status)
  const error = useEventStore((s) => s.error)
  const loadEvents = useEventStore((s) => s.loadEvents)

  const namespaceFilter = useNamespaceStore((s) => s.selected)
  const [typeFilter, setTypeFilter] = useState<'all' | EventType>('all')

  useEffect(() => {
    void loadEvents(namespaceFilter)
  }, [loadEvents, namespaceFilter])

  const visible = useMemo(
    () => (typeFilter === 'all' ? events : events.filter((event) => event.type === typeFilter)),
    [events, typeFilter],
  )

  return (
    <ResourcePage
      title="Events"
      countNoun="events"
      items={visible}
      getSearchText={searchText}
      status={status}
      error={error}
      onRetry={() => void loadEvents(namespaceFilter)}
      emptyIcon={CalendarClock}
      emptyTitle={typeFilter === 'all' ? 'No events found' : `No ${typeFilter.toLowerCase()} events`}
      emptyDescription={
        typeFilter === 'all'
          ? 'This namespace has no recent events, or the cluster is empty.'
          : 'Nothing in this namespace matches the selected type.'
      }
      toolbar={
        <div className="flex rounded-md border border-border-subtle p-0.5">
          {TYPE_FILTERS.map((filter) => (
            <button
              key={filter.id}
              type="button"
              onClick={() => setTypeFilter(filter.id)}
              className={clsx(
                'rounded px-2.5 py-1 text-xs font-medium transition-colors duration-150',
                typeFilter === filter.id ? 'bg-accent/20 text-blue-200' : 'text-fg-muted hover:text-fg',
              )}
            >
              {filter.label}
            </button>
          ))}
        </div>
      }
    >
      {(filtered) => <EventTable events={filtered} namespaceFilter={namespaceFilter} />}
    </ResourcePage>
  )
}
