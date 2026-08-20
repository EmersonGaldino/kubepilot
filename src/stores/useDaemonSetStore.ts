import { create } from 'zustand'

import { beginClusterRequest, isSameClusterRequest } from '@/lib/clusterRequest'
import { kubernetesApi } from '@/services/kubernetesApi'
import type { RequestStatus } from '@/types/ui'
import type { DaemonSetDetail, DaemonSetSummary } from '@shared/types'

interface DaemonSetState {
  daemonsets: DaemonSetSummary[]
  status: RequestStatus
  error: string | null

  selectedDaemonSet: DaemonSetDetail | null
  selectedDaemonSetStatus: RequestStatus

  loadDaemonSets: (namespace: string) => Promise<void>
  loadDaemonSetDetail: (namespace: string, name: string) => Promise<void>
  clearSelectedDaemonSet: () => void
}

export const useDaemonSetStore = create<DaemonSetState>((set) => ({
  daemonsets: [],
  status: 'idle',
  error: null,
  selectedDaemonSet: null,
  selectedDaemonSetStatus: 'idle',

  loadDaemonSets: async (namespace) => {
    const request = beginClusterRequest()
    set({ status: 'loading', error: null })
    try {
      const daemonsets = await kubernetesApi.daemonsets.list(namespace)
      if (!isSameClusterRequest(request)) return
      set({ daemonsets, status: 'success' })
    } catch (error) {
      if (!isSameClusterRequest(request)) return
      set({ status: 'error', error: error instanceof Error ? error.message : String(error) })
    }
  },

  loadDaemonSetDetail: async (namespace, name) => {
    const request = beginClusterRequest()
    set({ selectedDaemonSetStatus: 'loading' })
    try {
      const selectedDaemonSet = await kubernetesApi.daemonsets.get(namespace, name)
      if (!isSameClusterRequest(request)) return
      set({ selectedDaemonSet, selectedDaemonSetStatus: 'success' })
    } catch (error) {
      if (!isSameClusterRequest(request)) return
      set({ selectedDaemonSetStatus: 'error', error: error instanceof Error ? error.message : String(error) })
    }
  },

  clearSelectedDaemonSet: () => set({ selectedDaemonSet: null, selectedDaemonSetStatus: 'idle' }),
}))
