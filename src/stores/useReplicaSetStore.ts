import { create } from 'zustand'

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
    set({ status: 'loading', error: null })
    try {
      const replicaSets = await kubernetesApi.replicasets.list(namespace)
      set({ replicaSets, status: 'success' })
    } catch (error) {
      set({ status: 'error', error: error instanceof Error ? error.message : String(error) })
    }
  },

  loadReplicaSetDetail: async (namespace, name) => {
    set({ selectedReplicaSetStatus: 'loading' })
    try {
      const selectedReplicaSet = await kubernetesApi.replicasets.get(namespace, name)
      set({ selectedReplicaSet, selectedReplicaSetStatus: 'success' })
    } catch (error) {
      set({ selectedReplicaSetStatus: 'error', error: error instanceof Error ? error.message : String(error) })
    }
  },

  clearSelectedReplicaSet: () => set({ selectedReplicaSet: null, selectedReplicaSetStatus: 'idle' }),
}))
