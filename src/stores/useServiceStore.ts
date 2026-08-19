import { create } from 'zustand'

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
    set({ status: 'loading', error: null })
    try {
      const services = await kubernetesApi.services.list(namespace)
      set({ services, status: 'success' })
    } catch (error) {
      set({ status: 'error', error: error instanceof Error ? error.message : String(error) })
    }
  },

  loadServiceDetail: async (namespace, name) => {
    set({ selectedServiceStatus: 'loading' })
    try {
      const selectedService = await kubernetesApi.services.get(namespace, name)
      set({ selectedService, selectedServiceStatus: 'success' })
    } catch (error) {
      set({ selectedServiceStatus: 'error', error: error instanceof Error ? error.message : String(error) })
    }
  },

  clearSelectedService: () => set({ selectedService: null, selectedServiceStatus: 'idle' }),
}))
