import { create } from 'zustand'

import { beginClusterRequest, isSameClusterRequest } from '@/lib/clusterRequest'
import { kubernetesApi } from '@/services/kubernetesApi'
import type { RequestStatus } from '@/types/ui'
import type { NamespaceDetail, NamespaceSummary } from '@shared/types'

/** `'all'` is KubePilot's own "All namespaces" pseudo-value — every
 * namespace-scoped IPC call treats it as a request to aggregate everything. */
export const ALL_NAMESPACES = 'all' as const

interface NamespaceState {
  namespaces: NamespaceSummary[]
  selected: string
  status: RequestStatus
  error: string | null
  selectedDetail: NamespaceDetail | null
  selectedDetailStatus: RequestStatus

  loadNamespaces: () => Promise<void>
  loadNamespaceDetail: (name: string) => Promise<void>
  clearSelectedDetail: () => void
  createNamespace: (name: string, labels?: Record<string, string>) => Promise<void>
  deleteNamespace: (name: string) => Promise<void>
  select: (namespace: string) => void
}

export const useNamespaceStore = create<NamespaceState>((set) => ({
  namespaces: [],
  selected: ALL_NAMESPACES,
  status: 'idle',
  error: null,

  selectedDetail: null,
  selectedDetailStatus: 'idle',

  loadNamespaces: async () => {
    const request = beginClusterRequest()
    set({ status: 'loading', error: null })
    try {
      const namespaces = await kubernetesApi.namespaces.list()
      if (!isSameClusterRequest(request)) return
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
      if (!isSameClusterRequest(request)) return
      set({ status: 'error', error: error instanceof Error ? error.message : String(error) })
    }
  },

  select: (namespace) => set({ selected: namespace }),

  loadNamespaceDetail: async (name) => {
    const request = beginClusterRequest()
    set({ selectedDetailStatus: 'loading' })
    try {
      const selectedDetail = await kubernetesApi.namespaces.get(name)
      if (!isSameClusterRequest(request)) return
      set({ selectedDetail, selectedDetailStatus: 'success' })
    } catch (error) {
      if (!isSameClusterRequest(request)) return
      set({ selectedDetailStatus: 'error', error: error instanceof Error ? error.message : String(error) })
    }
  },

  clearSelectedDetail: () => set({ selectedDetail: null, selectedDetailStatus: 'idle' }),

  createNamespace: async (name, labels) => {
    await kubernetesApi.namespaces.create({ name, labels })
    await useNamespaceStore.getState().loadNamespaces()
  },

  deleteNamespace: async (name) => {
    await kubernetesApi.namespaces.delete(name)
    await useNamespaceStore.getState().loadNamespaces()
  },
}))
