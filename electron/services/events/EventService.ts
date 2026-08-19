import type { CoreV1Event } from '@kubernetes/client-node'

import type { EventSummary } from '../../../shared/types'
import type { ClusterService } from '../clusters/ClusterService'

function toSummary(event: CoreV1Event): EventSummary {
  return {
    uid: event.metadata?.uid ?? 'unknown',
    namespace: event.metadata?.namespace ?? 'unknown',
    type: event.type === 'Warning' ? 'Warning' : 'Normal',
    reason: event.reason ?? '',
    message: event.message ?? '',
    involvedObjectKind: event.involvedObject?.kind ?? '',
    involvedObjectName: event.involvedObject?.name ?? '',
    count: event.count ?? 1,
    firstSeen: event.firstTimestamp ? new Date(event.firstTimestamp).toISOString() : null,
    lastSeen: event.lastTimestamp
      ? new Date(event.lastTimestamp).toISOString()
      : event.eventTime
        ? new Date(event.eventTime).toISOString()
        : null,
  }
}

export interface EventListParams {
  namespace: string | 'all'
}

/** Reads Events (core/v1) for whichever context {@link ClusterService}
 * currently considers active. List-only — there's no per-event `get`, the
 * Kubernetes API has no `readNamespacedEvent` equivalent worth exposing. */
export class EventService {
  constructor(private readonly clusterService: ClusterService) {}

  async list({ namespace }: EventListParams): Promise<EventSummary[]> {
    const { coreV1Api } = this.clusterService.getActiveBundle()

    const { items } =
      namespace === 'all'
        ? await coreV1Api.listEventForAllNamespaces()
        : await coreV1Api.listNamespacedEvent({ namespace })

    return items.map(toSummary).sort((a, b) => {
      if (a.lastSeen === b.lastSeen) return 0
      if (a.lastSeen === null) return 1
      if (b.lastSeen === null) return -1
      return b.lastSeen.localeCompare(a.lastSeen)
    })
  }
}
