import { create } from 'zustand'

import { kubernetesApi } from '@/services/kubernetesApi'
import type { RequestStatus } from '@/types/ui'
import type { ConfigMapDetail, ConfigMapSummary } from '@shared/types'

interface ConfigMapState {
  configMaps: ConfigMapSummary[]
  status: RequestStatus
  error: string | null

  selectedConfigMap: ConfigMapDetail | null
  selectedConfigMapStatus: RequestStatus

  loadConfigMaps: (namespace: string) => Promise<void>
  loadConfigMapDetail: (namespace: string, name: string) => Promise<void>
  clearSelectedConfigMap: () => void
}

export const useConfigMapStore = create<ConfigMapState>((set) => ({
  configMaps: [],
  status: 'idle',
  error: null,
  selectedConfigMap: null,
  selectedConfigMapStatus: 'idle',

  loadConfigMaps: async (namespace) => {
    set({ status: 'loading', error: null })
    try {
      const configMaps = await kubernetesApi.configmaps.list(namespace)
      set({ configMaps, status: 'success' })
    } catch (error) {
      set({ status: 'error', error: error instanceof Error ? error.message : String(error) })
    }
  },

  loadConfigMapDetail: async (namespace, name) => {
    set({ selectedConfigMapStatus: 'loading' })
    try {
      const selectedConfigMap = await kubernetesApi.configmaps.get(namespace, name)
      set({ selectedConfigMap, selectedConfigMapStatus: 'success' })
    } catch (error) {
      set({ selectedConfigMapStatus: 'error', error: error instanceof Error ? error.message : String(error) })
    }
  },

  clearSelectedConfigMap: () => set({ selectedConfigMap: null, selectedConfigMapStatus: 'idle' }),
}))
