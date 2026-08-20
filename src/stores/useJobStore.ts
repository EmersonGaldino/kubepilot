import { create } from 'zustand'

import { beginClusterRequest, isSameClusterRequest } from '@/lib/clusterRequest'
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
    const request = beginClusterRequest()
    set({ status: 'loading', error: null })
    try {
      const jobs = await kubernetesApi.jobs.list(namespace)
      if (!isSameClusterRequest(request)) return
      set({ jobs, status: 'success' })
    } catch (error) {
      if (!isSameClusterRequest(request)) return
      set({ status: 'error', error: error instanceof Error ? error.message : String(error) })
    }
  },

  loadJobDetail: async (namespace, name) => {
    const request = beginClusterRequest()
    set({ selectedJobStatus: 'loading' })
    try {
      const selectedJob = await kubernetesApi.jobs.get(namespace, name)
      if (!isSameClusterRequest(request)) return
      set({ selectedJob, selectedJobStatus: 'success' })
    } catch (error) {
      if (!isSameClusterRequest(request)) return
      set({ selectedJobStatus: 'error', error: error instanceof Error ? error.message : String(error) })
    }
  },

  clearSelectedJob: () => set({ selectedJob: null, selectedJobStatus: 'idle' }),
}))
