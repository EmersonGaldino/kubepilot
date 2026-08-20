import { Clock } from 'lucide-react'
import { useEffect, useState } from 'react'

import { ResourcePage } from '@/components/common/ResourcePage'
import { CronJobDetailsDrawer } from '@/components/cronjobs/CronJobDetailsDrawer'
import { CronJobTable } from '@/components/cronjobs/CronJobTable'
import { useResourceFocus } from '@/hooks/useResourceFocus'
import { useCronJobStore } from '@/stores/useCronJobStore'
import { useClusterStore } from '@/stores/useClusterStore'
import { useNamespaceStore } from '@/stores/useNamespaceStore'
import type { CronJobSummary } from '@shared/types'

function searchText(item: CronJobSummary) {
  return `${item.name} ${item.namespace} ${item.schedule}`
}

export function CronJobs() {
  const cronjobs = useCronJobStore((s) => s.cronjobs)
  const status = useCronJobStore((s) => s.status)
  const error = useCronJobStore((s) => s.error)
  const loadCronJobs = useCronJobStore((s) => s.loadCronJobs)
  const loadCronJobDetail = useCronJobStore((s) => s.loadCronJobDetail)
  const clearSelectedCronJob = useCronJobStore((s) => s.clearSelectedCronJob)
  const selectedCronJob = useCronJobStore((s) => s.selectedCronJob)
  const selectedCronJobStatus = useCronJobStore((s) => s.selectedCronJobStatus)

  const namespaceFilter = useNamespaceStore((s) => s.selected)
  const currentContext = useClusterStore((s) => s.currentContext)
  const refreshGeneration = useClusterStore((s) => s.refreshGeneration)

  const [drawerOpen, setDrawerOpen] = useState(false)

  useEffect(() => {
    void loadCronJobs(namespaceFilter)
  }, [loadCronJobs, namespaceFilter, currentContext, refreshGeneration])

  const handleSelect = (cronJob: CronJobSummary) => {
    setDrawerOpen(true)
    void loadCronJobDetail(cronJob.namespace, cronJob.name)
  }

  useResourceFocus('cronjobs', cronjobs, (c) => c.name, handleSelect)

  const handleClose = () => {
    setDrawerOpen(false)
    clearSelectedCronJob()
  }

  return (
    <>
      <ResourcePage
        title="CronJobs"
        countNoun="cronjobs"
        items={cronjobs}
        getSearchText={searchText}
        status={status}
        error={error}
        onRetry={() => void loadCronJobs(namespaceFilter)}
        createKind="cronjob"
        onCreated={() => void loadCronJobs(namespaceFilter)}
        emptyIcon={Clock}
        emptyTitle="No cronjobs found"
        emptyDescription="This namespace has no cronjobs, or the cluster is empty."
        skeletonColumns={7}
      >
        {(filtered) => <CronJobTable cronjobs={filtered} namespaceFilter={namespaceFilter} onSelect={handleSelect} />}
      </ResourcePage>

      {drawerOpen && (
        <CronJobDetailsDrawer cronJob={selectedCronJob} loading={selectedCronJobStatus === 'loading'} onClose={handleClose} />
      )}
    </>
  )
}
