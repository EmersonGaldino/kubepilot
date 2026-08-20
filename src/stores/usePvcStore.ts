import { create } from 'zustand'

import { beginClusterRequest, isSameClusterRequest } from '@/lib/clusterRequest'
import { kubernetesApi } from '@/services/kubernetesApi'
import type { RequestStatus } from '@/types/ui'
import type { PvcDetail, PvcSummary } from '@shared/types'

interface PvcState {
  items: PvcSummary[]
  status: RequestStatus
  error: string | null
  selected: PvcDetail | null
  selectedStatus: RequestStatus
  loadPvcs: (namespace: string) => Promise<void>
  loadPvcDetail: (namespace: string, name: string) => Promise<void>
  clearSelected: () => void
}

export const usePvcStore = create<PvcState>((set) => ({
  items: [],
  status: 'idle',
  error: null,
  selected: null,
  selectedStatus: 'idle',

  loadPvcs: async (namespace) => {
    const request = beginClusterRequest()
    set({ status: 'loading', error: null })
    try {
      const items = await kubernetesApi.pvcs.list(namespace)
      if (!isSameClusterRequest(request)) return
      set({ items, status: 'success' })
    } catch (error) {
      if (!isSameClusterRequest(request)) return
      set({ status: 'error', error: error instanceof Error ? error.message : String(error) })
    }
  },

  loadPvcDetail: async (namespace, name) => {
    const request = beginClusterRequest()
    set({ selectedStatus: 'loading' })
    try {
      const selected = await kubernetesApi.pvcs.get(namespace, name)
      if (!isSameClusterRequest(request)) return
      set({ selected, selectedStatus: 'success' })
    } catch (error) {
      if (!isSameClusterRequest(request)) return
      set({ selectedStatus: 'error', error: error instanceof Error ? error.message : String(error) })
    }
  },

  clearSelected: () => set({ selected: null, selectedStatus: 'idle' }),
}))
