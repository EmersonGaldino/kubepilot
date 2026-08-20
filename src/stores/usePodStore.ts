import { create } from 'zustand'

import { beginClusterRequest, isSameClusterRequest } from '@/lib/clusterRequest'
import { kubernetesApi } from '@/services/kubernetesApi'
import type { RequestStatus } from '@/types/ui'
import type { PodDetail, PodSummary } from '@shared/types'

interface PodState {
  pods: PodSummary[]
  status: RequestStatus
  error: string | null

  selectedPod: PodDetail | null
  selectedPodStatus: RequestStatus

  loadPods: (namespace: string) => Promise<void>
  loadPodDetail: (namespace: string, name: string) => Promise<void>
  clearSelectedPod: () => void
}

export const usePodStore = create<PodState>((set) => ({
  pods: [],
  status: 'idle',
  error: null,
  selectedPod: null,
  selectedPodStatus: 'idle',

  loadPods: async (namespace) => {
    const request = beginClusterRequest()
    set({ status: 'loading', error: null })
    try {
      const pods = await kubernetesApi.pods.list(namespace)
      if (!isSameClusterRequest(request)) return
      set({ pods, status: 'success' })
    } catch (error) {
      if (!isSameClusterRequest(request)) return
      set({ status: 'error', error: error instanceof Error ? error.message : String(error) })
    }
  },

  loadPodDetail: async (namespace, name) => {
    const request = beginClusterRequest()
    set({ selectedPodStatus: 'loading' })
    try {
      const selectedPod = await kubernetesApi.pods.get(namespace, name)
      if (!isSameClusterRequest(request)) return
      set({ selectedPod, selectedPodStatus: 'success' })
    } catch (error) {
      if (!isSameClusterRequest(request)) return
      set({ selectedPodStatus: 'error', error: error instanceof Error ? error.message : String(error) })
    }
  },

  clearSelectedPod: () => set({ selectedPod: null, selectedPodStatus: 'idle' }),
}))
