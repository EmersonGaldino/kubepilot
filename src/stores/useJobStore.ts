import { create } from 'zustand'

import { kubernetesApi } from '@/services/kubernetesApi'
import type { RequestStatus } from '@/types/ui'
import type { JobDetail, JobSummary } from '@shared/types'

interface JobState {
  jobs: JobSummary[]
  status: RequestStatus
  error: string | null

  selectedJob: JobDetail | null
  selectedJobStatus: RequestStatus

  loadJobs: (namespace: string) => Promise<void>
  loadJobDetail: (namespace: string, name: string) => Promise<void>
  clearSelectedJob: () => void
}

export const useJobStore = create<JobState>((set) => ({
  jobs: [],
  status: 'idle',
  error: null,
  selectedJob: null,
  selectedJobStatus: 'idle',

  loadJobs: async (namespace) => {
    set({ status: 'loading', error: null })
    try {
      const jobs = await kubernetesApi.jobs.list(namespace)
      set({ jobs, status: 'success' })
    } catch (error) {
      set({ status: 'error', error: error instanceof Error ? error.message : String(error) })
    }
  },

  loadJobDetail: async (namespace, name) => {
    set({ selectedJobStatus: 'loading' })
    try {
      const selectedJob = await kubernetesApi.jobs.get(namespace, name)
      set({ selectedJob, selectedJobStatus: 'success' })
    } catch (error) {
      set({ selectedJobStatus: 'error', error: error instanceof Error ? error.message : String(error) })
    }
  },

  clearSelectedJob: () => set({ selectedJob: null, selectedJobStatus: 'idle' }),
}))
