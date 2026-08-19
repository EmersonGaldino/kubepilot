import { Briefcase } from 'lucide-react'
import { useEffect, useState } from 'react'

import { ResourcePage } from '@/components/common/ResourcePage'
import { JobDetailsDrawer } from '@/components/jobs/JobDetailsDrawer'
import { JobTable } from '@/components/jobs/JobTable'
import { useJobStore } from '@/stores/useJobStore'
import { useNamespaceStore } from '@/stores/useNamespaceStore'
import type { JobSummary } from '@shared/types'

function searchText(item: JobSummary) {
  return `${item.name} ${item.namespace} ${item.status}`
}

export function Jobs() {
  const jobs = useJobStore((s) => s.jobs)
  const status = useJobStore((s) => s.status)
  const error = useJobStore((s) => s.error)
  const loadJobs = useJobStore((s) => s.loadJobs)
  const loadJobDetail = useJobStore((s) => s.loadJobDetail)
  const clearSelectedJob = useJobStore((s) => s.clearSelectedJob)
  const selectedJob = useJobStore((s) => s.selectedJob)
  const selectedJobStatus = useJobStore((s) => s.selectedJobStatus)

  const namespaceFilter = useNamespaceStore((s) => s.selected)

  const [drawerOpen, setDrawerOpen] = useState(false)

  useEffect(() => {
    void loadJobs(namespaceFilter)
  }, [loadJobs, namespaceFilter])

  const handleSelect = (job: JobSummary) => {
    setDrawerOpen(true)
    void loadJobDetail(job.namespace, job.name)
  }

  const handleClose = () => {
    setDrawerOpen(false)
    clearSelectedJob()
  }

  return (
    <>
      <ResourcePage
        title="Jobs"
        countNoun="jobs"
        items={jobs}
        getSearchText={searchText}
        status={status}
        error={error}
        onRetry={() => void loadJobs(namespaceFilter)}
        emptyIcon={Briefcase}
        emptyTitle="No jobs found"
        emptyDescription="This namespace has no jobs, or the cluster is empty."
      >
        {(filtered) => <JobTable jobs={filtered} namespaceFilter={namespaceFilter} onSelect={handleSelect} />}
      </ResourcePage>

      {drawerOpen && <JobDetailsDrawer job={selectedJob} loading={selectedJobStatus === 'loading'} onClose={handleClose} />}
    </>
  )
}
