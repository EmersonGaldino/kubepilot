import clsx from 'clsx'

import { ALL_NAMESPACES } from '@/stores/useNamespaceStore'
import type { EventSummary, EventType } from '@shared/types'

const EVENT_TYPE_STYLES: Record<EventType, string> = {
  Normal: 'bg-white/5 text-fg-muted ring-white/10',
  Warning: 'bg-amber-500/15 text-amber-300 ring-amber-500/30',
}

function EventTypeBadge({ type }: { type: EventType }) {
  return (
    <span className={clsx('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset', EVENT_TYPE_STYLES[type])}>
      {type}
    </span>
  )
}

export function EventTable({ events, namespaceFilter }: { events: EventSummary[]; namespaceFilter: string }) {
  const showNamespaceColumn = namespaceFilter === ALL_NAMESPACES

  return (
    <table className="kp-table">
      <thead>
        <tr>
          {showNamespaceColumn && <th>Namespace</th>}
          <th>Type</th>
          <th>Reason</th>
          <th>Message</th>
          <th>Involved Object</th>
          <th>Count</th>
          <th>Last Seen</th>
        </tr>
      </thead>
      <tbody>
        {events.map((event) => (
          <tr key={event.uid}>
            {showNamespaceColumn && <td className="text-fg-subtle">{event.namespace}</td>}
            <td>
              <EventTypeBadge type={event.type} />
            </td>
            <td className="font-medium text-fg">{event.reason}</td>
            <td className="max-w-xs truncate text-fg-muted" title={event.message}>
              {event.message}
            </td>
            <td className="text-fg-subtle">
              {event.involvedObjectKind}/{event.involvedObjectName}
            </td>
            <td className="tabular-nums text-fg-muted">{event.count}</td>
            <td className="text-fg-subtle">{event.lastSeen ? new Date(event.lastSeen).toLocaleString() : '—'}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
