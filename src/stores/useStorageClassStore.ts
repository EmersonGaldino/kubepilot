import { create } from 'zustand'

import { beginClusterRequest, isSameClusterRequest } from '@/lib/clusterRequest'
import { kubernetesApi } from '@/services/kubernetesApi'
import type { RequestStatus } from '@/types/ui'
import type { StorageClassDetail, StorageClassSummary } from '@shared/types'

interface StorageClassState {
  items: StorageClassSummary[]
  status: RequestStatus
  error: string | null
  selected: StorageClassDetail | null
  selectedStatus: RequestStatus
  loadStorageClasses: () => Promise<void>
  loadStorageClassDetail: (name: string) => Promise<void>
  clearSelected: () => void
}

export const useStorageClassStore = create<StorageClassState>((set) => ({
  items: [],
  status: 'idle',
  error: null,
  selected: null,
  selectedStatus: 'idle',

  loadStorageClasses: async () => {
    const request = beginClusterRequest()
    set({ status: 'loading', error: null })
    try {
      const items = await kubernetesApi.storageclasses.list()
      if (!isSameClusterRequest(request)) return
      set({ items, status: 'success' })
    } catch (error) {
      if (!isSameClusterRequest(request)) return
      set({ status: 'error', error: error instanceof Error ? error.message : String(error) })
    }
  },

  loadStorageClassDetail: async (name) => {
    const request = beginClusterRequest()
    set({ selectedStatus: 'loading' })
    try {
      const selected = await kubernetesApi.storageclasses.get(name)
      if (!isSameClusterRequest(request)) return
      set({ selected, selectedStatus: 'success' })
    } catch (error) {
      if (!isSameClusterRequest(request)) return
      set({ selectedStatus: 'error', error: error instanceof Error ? error.message : String(error) })
    }
  },

  clearSelected: () => set({ selected: null, selectedStatus: 'idle' }),
}))
