import { create } from 'zustand'

import { beginClusterRequest, isSameClusterRequest } from '@/lib/clusterRequest'
import { kubernetesApi } from '@/services/kubernetesApi'
import type { RequestStatus } from '@/types/ui'
import type { StatefulSetDetail, StatefulSetSummary } from '@shared/types'

interface StatefulSetState {
  statefulsets: StatefulSetSummary[]
  status: RequestStatus
  error: string | null

  selectedStatefulSet: StatefulSetDetail | null
  selectedStatefulSetStatus: RequestStatus

  loadStatefulSets: (namespace: string) => Promise<void>
  loadStatefulSetDetail: (namespace: string, name: string) => Promise<void>
  clearSelectedStatefulSet: () => void
}

export const useStatefulSetStore = create<StatefulSetState>((set) => ({
  statefulsets: [],
  status: 'idle',
  error: null,
  selectedStatefulSet: null,
  selectedStatefulSetStatus: 'idle',

  loadStatefulSets: async (namespace) => {
    const request = beginClusterRequest()
    set({ status: 'loading', error: null })
    try {
      const statefulsets = await kubernetesApi.statefulsets.list(namespace)
      if (!isSameClusterRequest(request)) return
      set({ statefulsets, status: 'success' })
    } catch (error) {
      if (!isSameClusterRequest(request)) return
      set({ status: 'error', error: error instanceof Error ? error.message : String(error) })
    }
  },

  loadStatefulSetDetail: async (namespace, name) => {
    const request = beginClusterRequest()
    set({ selectedStatefulSetStatus: 'loading' })
    try {
      const selectedStatefulSet = await kubernetesApi.statefulsets.get(namespace, name)
      if (!isSameClusterRequest(request)) return
      set({ selectedStatefulSet, selectedStatefulSetStatus: 'success' })
    } catch (error) {
      if (!isSameClusterRequest(request)) return
      set({ selectedStatefulSetStatus: 'error', error: error instanceof Error ? error.message : String(error) })
    }
  },

  clearSelectedStatefulSet: () => set({ selectedStatefulSet: null, selectedStatefulSetStatus: 'idle' }),
}))
