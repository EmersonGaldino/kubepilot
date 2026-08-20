import { create } from 'zustand'

import { beginClusterRequest, isSameClusterRequest } from '@/lib/clusterRequest'
import { kubernetesApi } from '@/services/kubernetesApi'
import type { RequestStatus } from '@/types/ui'
import type { ServiceDetail, ServiceSummary } from '@shared/types'

interface ServiceState {
  services: ServiceSummary[]
  status: RequestStatus
  error: string | null

  selectedService: ServiceDetail | null
  selectedServiceStatus: RequestStatus

  loadServices: (namespace: string) => Promise<void>
  loadServiceDetail: (namespace: string, name: string) => Promise<void>
  clearSelectedService: () => void
}

export const useServiceStore = create<ServiceState>((set) => ({
  services: [],
  status: 'idle',
  error: null,
  selectedService: null,
  selectedServiceStatus: 'idle',

  loadServices: async (namespace) => {
    const request = beginClusterRequest()
    set({ status: 'loading', error: null })
    try {
      const services = await kubernetesApi.services.list(namespace)
      if (!isSameClusterRequest(request)) return
      set({ services, status: 'success' })
    } catch (error) {
      if (!isSameClusterRequest(request)) return
      set({ status: 'error', error: error instanceof Error ? error.message : String(error) })
    }
  },

  loadServiceDetail: async (namespace, name) => {
    const request = beginClusterRequest()
    set({ selectedServiceStatus: 'loading' })
    try {
      const selectedService = await kubernetesApi.services.get(namespace, name)
      if (!isSameClusterRequest(request)) return
      set({ selectedService, selectedServiceStatus: 'success' })
    } catch (error) {
      if (!isSameClusterRequest(request)) return
      set({ selectedServiceStatus: 'error', error: error instanceof Error ? error.message : String(error) })
    }
  },

  clearSelectedService: () => set({ selectedService: null, selectedServiceStatus: 'idle' }),
}))
