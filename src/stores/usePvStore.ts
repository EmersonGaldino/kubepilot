import { create } from 'zustand'

import { beginClusterRequest, isSameClusterRequest } from '@/lib/clusterRequest'
import { kubernetesApi } from '@/services/kubernetesApi'
import type { RequestStatus } from '@/types/ui'
import type { PvDetail, PvSummary } from '@shared/types'

interface PvState {
  items: PvSummary[]
  status: RequestStatus
  error: string | null
  selected: PvDetail | null
  selectedStatus: RequestStatus
  loadPvs: () => Promise<void>
  loadPvDetail: (name: string) => Promise<void>
  clearSelected: () => void
}

export const usePvStore = create<PvState>((set) => ({
  items: [],
  status: 'idle',
  error: null,
  selected: null,
  selectedStatus: 'idle',

  loadPvs: async () => {
    const request = beginClusterRequest()
    set({ status: 'loading', error: null })
    try {
      const items = await kubernetesApi.pvs.list()
      if (!isSameClusterRequest(request)) return
      set({ items, status: 'success' })
    } catch (error) {
      if (!isSameClusterRequest(request)) return
      set({ status: 'error', error: error instanceof Error ? error.message : String(error) })
    }
  },

  loadPvDetail: async (name) => {
    const request = beginClusterRequest()
    set({ selectedStatus: 'loading' })
    try {
      const selected = await kubernetesApi.pvs.get(name)
      if (!isSameClusterRequest(request)) return
      set({ selected, selectedStatus: 'success' })
    } catch (error) {
      if (!isSameClusterRequest(request)) return
      set({ selectedStatus: 'error', error: error instanceof Error ? error.message : String(error) })
    }
  },

  clearSelected: () => set({ selected: null, selectedStatus: 'idle' }),
}))
