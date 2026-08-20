import { create } from 'zustand'

import { beginClusterRequest, isSameClusterRequest } from '@/lib/clusterRequest'
import { kubernetesApi } from '@/services/kubernetesApi'
import type { RequestStatus } from '@/types/ui'
import type { CronJobDetail, CronJobSummary } from '@shared/types'

interface CronJobState {
  cronjobs: CronJobSummary[]
  status: RequestStatus
  error: string | null

  selectedCronJob: CronJobDetail | null
  selectedCronJobStatus: RequestStatus

  loadCronJobs: (namespace: string) => Promise<void>
  loadCronJobDetail: (namespace: string, name: string) => Promise<void>
  clearSelectedCronJob: () => void
}

export const useCronJobStore = create<CronJobState>((set) => ({
  cronjobs: [],
  status: 'idle',
  error: null,
  selectedCronJob: null,
  selectedCronJobStatus: 'idle',

  loadCronJobs: async (namespace) => {
    const request = beginClusterRequest()
    set({ status: 'loading', error: null })
    try {
      const cronjobs = await kubernetesApi.cronjobs.list(namespace)
      if (!isSameClusterRequest(request)) return
      set({ cronjobs, status: 'success' })
    } catch (error) {
      if (!isSameClusterRequest(request)) return
      set({ status: 'error', error: error instanceof Error ? error.message : String(error) })
    }
  },

  loadCronJobDetail: async (namespace, name) => {
    const request = beginClusterRequest()
    set({ selectedCronJobStatus: 'loading' })
    try {
      const selectedCronJob = await kubernetesApi.cronjobs.get(namespace, name)
      if (!isSameClusterRequest(request)) return
      set({ selectedCronJob, selectedCronJobStatus: 'success' })
    } catch (error) {
      if (!isSameClusterRequest(request)) return
      set({ selectedCronJobStatus: 'error', error: error instanceof Error ? error.message : String(error) })
    }
  },

  clearSelectedCronJob: () => set({ selectedCronJob: null, selectedCronJobStatus: 'idle' }),
}))
