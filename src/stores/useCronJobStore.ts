import { create } from 'zustand'

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
    set({ status: 'loading', error: null })
    try {
      const cronjobs = await kubernetesApi.cronjobs.list(namespace)
      set({ cronjobs, status: 'success' })
    } catch (error) {
      set({ status: 'error', error: error instanceof Error ? error.message : String(error) })
    }
  },

  loadCronJobDetail: async (namespace, name) => {
    set({ selectedCronJobStatus: 'loading' })
    try {
      const selectedCronJob = await kubernetesApi.cronjobs.get(namespace, name)
      set({ selectedCronJob, selectedCronJobStatus: 'success' })
    } catch (error) {
      set({ selectedCronJobStatus: 'error', error: error instanceof Error ? error.message : String(error) })
    }
  },

  clearSelectedCronJob: () => set({ selectedCronJob: null, selectedCronJobStatus: 'idle' }),
}))
