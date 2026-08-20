import { create } from 'zustand'

import { beginClusterRequest, isSameClusterRequest } from '@/lib/clusterRequest'
import { kubernetesApi } from '@/services/kubernetesApi'
import type { RequestStatus } from '@/types/ui'
import type { ReplicaSetDetail, ReplicaSetSummary } from '@shared/types'

interface ReplicaSetState {
  replicaSets: ReplicaSetSummary[]
  status: RequestStatus
  error: string | null

  selectedReplicaSet: ReplicaSetDetail | null
  selectedReplicaSetStatus: RequestStatus

  loadReplicaSets: (namespace: string) => Promise<void>
  loadReplicaSetDetail: (namespace: string, name: string) => Promise<void>
  clearSelectedReplicaSet: () => void
}

export const useReplicaSetStore = create<ReplicaSetState>((set) => ({
  replicaSets: [],
  status: 'idle',
  error: null,
  selectedReplicaSet: null,
  selectedReplicaSetStatus: 'idle',

  loadReplicaSets: async (namespace) => {
    const request = beginClusterRequest()
    set({ status: 'loading', error: null })
    try {
      const replicaSets = await kubernetesApi.replicasets.list(namespace)
      if (!isSameClusterRequest(request)) return
      set({ replicaSets, status: 'success' })
    } catch (error) {
      if (!isSameClusterRequest(request)) return
      set({ status: 'error', error: error instanceof Error ? error.message : String(error) })
    }
  },

  loadReplicaSetDetail: async (namespace, name) => {
    const request = beginClusterRequest()
    set({ selectedReplicaSetStatus: 'loading' })
    try {
      const selectedReplicaSet = await kubernetesApi.replicasets.get(namespace, name)
      if (!isSameClusterRequest(request)) return
      set({ selectedReplicaSet, selectedReplicaSetStatus: 'success' })
    } catch (error) {
      if (!isSameClusterRequest(request)) return
      set({ selectedReplicaSetStatus: 'error', error: error instanceof Error ? error.message : String(error) })
    }
  },

  clearSelectedReplicaSet: () => set({ selectedReplicaSet: null, selectedReplicaSetStatus: 'idle' }),
}))
