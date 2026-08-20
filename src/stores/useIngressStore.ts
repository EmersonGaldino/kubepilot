import { create } from 'zustand'

import { beginClusterRequest, isSameClusterRequest } from '@/lib/clusterRequest'
import { kubernetesApi } from '@/services/kubernetesApi'
import type { RequestStatus } from '@/types/ui'
import type { IngressDetail, IngressSummary } from '@shared/types'

interface IngressState {
  ingresses: IngressSummary[]
  status: RequestStatus
  error: string | null
  selectedIngress: IngressDetail | null
  selectedIngressStatus: RequestStatus
  loadIngresses: (namespace: string) => Promise<void>
  loadIngressDetail: (namespace: string, name: string) => Promise<void>
  clearSelectedIngress: () => void
}

export const useIngressStore = create<IngressState>((set) => ({
  ingresses: [],
  status: 'idle',
  error: null,
  selectedIngress: null,
  selectedIngressStatus: 'idle',

  loadIngresses: async (namespace) => {
    const request = beginClusterRequest()
    set({ status: 'loading', error: null })
    try {
      const ingresses = await kubernetesApi.ingresses.list(namespace)
      if (!isSameClusterRequest(request)) return
      set({ ingresses, status: 'success' })
    } catch (error) {
      if (!isSameClusterRequest(request)) return
      set({ status: 'error', error: error instanceof Error ? error.message : String(error) })
    }
  },

  loadIngressDetail: async (namespace, name) => {
    const request = beginClusterRequest()
    set({ selectedIngressStatus: 'loading' })
    try {
      const selectedIngress = await kubernetesApi.ingresses.get(namespace, name)
      if (!isSameClusterRequest(request)) return
      set({ selectedIngress, selectedIngressStatus: 'success' })
    } catch (error) {
      if (!isSameClusterRequest(request)) return
      set({ selectedIngressStatus: 'error', error: error instanceof Error ? error.message : String(error) })
    }
  },

  clearSelectedIngress: () => set({ selectedIngress: null, selectedIngressStatus: 'idle' }),
}))
