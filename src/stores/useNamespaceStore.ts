import { create } from 'zustand'

import { kubernetesApi } from '@/services/kubernetesApi'
import type { RequestStatus } from '@/types/ui'
import type { NamespaceSummary } from '@shared/types'

/** `'all'` is KubePilot's own "All namespaces" pseudo-value — every
 * namespace-scoped IPC call treats it as a request to aggregate everything. */
export const ALL_NAMESPACES = 'all' as const

interface NamespaceState {
  namespaces: NamespaceSummary[]
  selected: string
  status: RequestStatus
  error: string | null

  loadNamespaces: () => Promise<void>
  select: (namespace: string) => void
}

export const useNamespaceStore = create<NamespaceState>((set) => ({
  namespaces: [],
  selected: ALL_NAMESPACES,
  status: 'idle',
  error: null,

  loadNamespaces: async () => {
    set({ status: 'loading', error: null })
    try {
      const namespaces = await kubernetesApi.namespaces.list()
      set((state) => ({
        namespaces,
        status: 'success',
        // If the previously selected namespace disappeared (context switch,
        // deletion), fall back to "All namespaces" instead of an empty view.
        selected:
          state.selected === ALL_NAMESPACES || namespaces.some((ns) => ns.name === state.selected)
            ? state.selected
            : ALL_NAMESPACES,
      }))
    } catch (error) {
      set({ status: 'error', error: error instanceof Error ? error.message : String(error) })
    }
  },

  select: (namespace) => set({ selected: namespace }),
}))
