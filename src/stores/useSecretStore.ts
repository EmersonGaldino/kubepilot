import { create } from 'zustand'

import { beginClusterRequest, isSameClusterRequest } from '@/lib/clusterRequest'
import { kubernetesApi } from '@/services/kubernetesApi'
import type { RequestStatus } from '@/types/ui'
import type { SecretDetail, SecretSummary } from '@shared/types'

interface SecretState {
  secrets: SecretSummary[]
  status: RequestStatus
  error: string | null

  selectedSecret: SecretDetail | null
  selectedSecretStatus: RequestStatus

  loadSecrets: (namespace: string) => Promise<void>
  loadSecretDetail: (namespace: string, name: string) => Promise<void>
  clearSelectedSecret: () => void
}

export const useSecretStore = create<SecretState>((set) => ({
  secrets: [],
  status: 'idle',
  error: null,
  selectedSecret: null,
  selectedSecretStatus: 'idle',

  loadSecrets: async (namespace) => {
    const request = beginClusterRequest()
    set({ status: 'loading', error: null })
    try {
      const secrets = await kubernetesApi.secrets.list(namespace)
      if (!isSameClusterRequest(request)) return
      set({ secrets, status: 'success' })
    } catch (error) {
      if (!isSameClusterRequest(request)) return
      set({ status: 'error', error: error instanceof Error ? error.message : String(error) })
    }
  },

  loadSecretDetail: async (namespace, name) => {
    const request = beginClusterRequest()
    set({ selectedSecretStatus: 'loading' })
    try {
      const selectedSecret = await kubernetesApi.secrets.get(namespace, name)
      if (!isSameClusterRequest(request)) return
      set({ selectedSecret, selectedSecretStatus: 'success' })
    } catch (error) {
      if (!isSameClusterRequest(request)) return
      set({ selectedSecretStatus: 'error', error: error instanceof Error ? error.message : String(error) })
    }
  },

  clearSelectedSecret: () => set({ selectedSecret: null, selectedSecretStatus: 'idle' }),
}))
