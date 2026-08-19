import { create } from 'zustand'

import { kubernetesApi } from '@/services/kubernetesApi'
import type { RequestStatus } from '@/types/ui'
import type { EventSummary } from '@shared/types'

interface EventState {
  events: EventSummary[]
  status: RequestStatus
  error: string | null

  loadEvents: (namespace: string) => Promise<void>
}

/** Events are list-only and have no detail/drawer — there's no per-event
 * `get`, so unlike the other resource stores this one carries no
 * selected/detail state. */
export const useEventStore = create<EventState>((set) => ({
  events: [],
  status: 'idle',
  error: null,

  loadEvents: async (namespace) => {
    set({ status: 'loading', error: null })
    try {
      const events = await kubernetesApi.events.list(namespace)
      set({ events, status: 'success' })
    } catch (error) {
      set({ status: 'error', error: error instanceof Error ? error.message : String(error) })
    }
  },
}))
