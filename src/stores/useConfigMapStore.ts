import { create } from 'zustand'

import { beginClusterRequest, isSameClusterRequest } from '@/lib/clusterRequest'
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
    const request = beginClusterRequest()
    set({ status: 'loading', error: null })
    try {
      const configMaps = await kubernetesApi.configmaps.list(namespace)
      if (!isSameClusterRequest(request)) return
      set({ configMaps, status: 'success' })
    } catch (error) {
      if (!isSameClusterRequest(request)) return
      set({ status: 'error', error: error instanceof Error ? error.message : String(error) })
    }
  },

  loadConfigMapDetail: async (namespace, name) => {
    const request = beginClusterRequest()
    set({ selectedConfigMapStatus: 'loading' })
    try {
      const selectedConfigMap = await kubernetesApi.configmaps.get(namespace, name)
      if (!isSameClusterRequest(request)) return
      set({ selectedConfigMap, selectedConfigMapStatus: 'success' })
    } catch (error) {
      if (!isSameClusterRequest(request)) return
      set({ selectedConfigMapStatus: 'error', error: error instanceof Error ? error.message : String(error) })
    }
  },

  clearSelectedConfigMap: () => set({ selectedConfigMap: null, selectedConfigMapStatus: 'idle' }),
}))
