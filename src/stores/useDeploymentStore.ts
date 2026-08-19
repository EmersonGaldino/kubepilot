import { create } from 'zustand'

import { kubernetesApi } from '@/services/kubernetesApi'
import type { RequestStatus } from '@/types/ui'
import type { DeploymentDetail, DeploymentSummary } from '@shared/types'

interface DeploymentState {
  deployments: DeploymentSummary[]
  status: RequestStatus
  error: string | null

  selectedDeployment: DeploymentDetail | null
  selectedDeploymentStatus: RequestStatus

  loadDeployments: (namespace: string) => Promise<void>
  loadDeploymentDetail: (namespace: string, name: string) => Promise<void>
  clearSelectedDeployment: () => void
}

export const useDeploymentStore = create<DeploymentState>((set) => ({
  deployments: [],
  status: 'idle',
  error: null,
  selectedDeployment: null,
  selectedDeploymentStatus: 'idle',

  loadDeployments: async (namespace) => {
    set({ status: 'loading', error: null })
    try {
      const deployments = await kubernetesApi.deployments.list(namespace)
      set({ deployments, status: 'success' })
    } catch (error) {
      set({ status: 'error', error: error instanceof Error ? error.message : String(error) })
    }
  },

  loadDeploymentDetail: async (namespace, name) => {
    set({ selectedDeploymentStatus: 'loading' })
    try {
      const selectedDeployment = await kubernetesApi.deployments.get(namespace, name)
      set({ selectedDeployment, selectedDeploymentStatus: 'success' })
    } catch (error) {
      set({ selectedDeploymentStatus: 'error', error: error instanceof Error ? error.message : String(error) })
    }
  },

  clearSelectedDeployment: () => set({ selectedDeployment: null, selectedDeploymentStatus: 'idle' }),
}))
