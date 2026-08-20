import { create } from 'zustand'

import { beginClusterRequest, isSameClusterRequest } from '@/lib/clusterRequest'
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
    const request = beginClusterRequest()
    set({ status: 'loading', error: null })
    try {
      const deployments = await kubernetesApi.deployments.list(namespace)
      if (!isSameClusterRequest(request)) return
      set({ deployments, status: 'success' })
    } catch (error) {
      if (!isSameClusterRequest(request)) return
      set({ status: 'error', error: error instanceof Error ? error.message : String(error) })
    }
  },

  loadDeploymentDetail: async (namespace, name) => {
    const request = beginClusterRequest()
    set({ selectedDeploymentStatus: 'loading' })
    try {
      const selectedDeployment = await kubernetesApi.deployments.get(namespace, name)
      if (!isSameClusterRequest(request)) return
      set({ selectedDeployment, selectedDeploymentStatus: 'success' })
    } catch (error) {
      if (!isSameClusterRequest(request)) return
      set({ selectedDeploymentStatus: 'error', error: error instanceof Error ? error.message : String(error) })
    }
  },

  clearSelectedDeployment: () => set({ selectedDeployment: null, selectedDeploymentStatus: 'idle' }),
}))
