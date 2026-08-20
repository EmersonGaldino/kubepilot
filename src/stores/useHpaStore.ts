import { create } from 'zustand'

import { beginClusterRequest, isSameClusterRequest } from '@/lib/clusterRequest'
import { kubernetesApi } from '@/services/kubernetesApi'
import type { RequestStatus } from '@/types/ui'
import type { HpaDetail, HpaSummary } from '@shared/types'

interface HpaState {
  items: HpaSummary[]
  status: RequestStatus
  error: string | null
  selected: HpaDetail | null
  selectedStatus: RequestStatus
  loadHpas: (namespace: string) => Promise<void>
  loadHpaDetail: (namespace: string, name: string) => Promise<void>
  clearSelected: () => void
}

export const useHpaStore = create<HpaState>((set) => ({
  items: [],
  status: 'idle',
  error: null,
  selected: null,
  selectedStatus: 'idle',

  loadHpas: async (namespace) => {
    const request = beginClusterRequest()
    set({ status: 'loading', error: null })
    try {
      const items = await kubernetesApi.hpa.list(namespace)
      if (!isSameClusterRequest(request)) return
      set({ items, status: 'success' })
    } catch (error) {
      if (!isSameClusterRequest(request)) return
      set({ status: 'error', error: error instanceof Error ? error.message : String(error) })
    }
  },

  loadHpaDetail: async (namespace, name) => {
    const request = beginClusterRequest()
    set({ selectedStatus: 'loading' })
    try {
      const selected = await kubernetesApi.hpa.get(namespace, name)
      if (!isSameClusterRequest(request)) return
      set({ selected, selectedStatus: 'success' })
    } catch (error) {
      if (!isSameClusterRequest(request)) return
      set({ selectedStatus: 'error', error: error instanceof Error ? error.message : String(error) })
    }
  },

  clearSelected: () => set({ selected: null, selectedStatus: 'idle' }),
}))
