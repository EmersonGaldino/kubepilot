import { SquareStack } from 'lucide-react'
import { useEffect, useState } from 'react'

import { ResourcePage } from '@/components/common/ResourcePage'
import { DaemonSetDetailsDrawer } from '@/components/daemonsets/DaemonSetDetailsDrawer'
import { DaemonSetTable } from '@/components/daemonsets/DaemonSetTable'
import { useDaemonSetStore } from '@/stores/useDaemonSetStore'
import { useNamespaceStore } from '@/stores/useNamespaceStore'
import type { DaemonSetSummary } from '@shared/types'

function searchText(item: DaemonSetSummary) {
  return `${item.name} ${item.namespace} ${item.status}`
}

export function DaemonSets() {
  const daemonsets = useDaemonSetStore((s) => s.daemonsets)
  const status = useDaemonSetStore((s) => s.status)
  const error = useDaemonSetStore((s) => s.error)
  const loadDaemonSets = useDaemonSetStore((s) => s.loadDaemonSets)
  const loadDaemonSetDetail = useDaemonSetStore((s) => s.loadDaemonSetDetail)
  const clearSelectedDaemonSet = useDaemonSetStore((s) => s.clearSelectedDaemonSet)
  const selectedDaemonSet = useDaemonSetStore((s) => s.selectedDaemonSet)
  const selectedDaemonSetStatus = useDaemonSetStore((s) => s.selectedDaemonSetStatus)

  const namespaceFilter = useNamespaceStore((s) => s.selected)

  const [drawerOpen, setDrawerOpen] = useState(false)

  useEffect(() => {
    void loadDaemonSets(namespaceFilter)
  }, [loadDaemonSets, namespaceFilter])

  const handleSelect = (daemonSet: DaemonSetSummary) => {
    setDrawerOpen(true)
    void loadDaemonSetDetail(daemonSet.namespace, daemonSet.name)
  }

  const handleClose = () => {
    setDrawerOpen(false)
    clearSelectedDaemonSet()
  }

  return (
    <>
      <ResourcePage
        title="DaemonSets"
        countNoun="daemonsets"
        items={daemonsets}
        getSearchText={searchText}
        status={status}
        error={error}
        onRetry={() => void loadDaemonSets(namespaceFilter)}
        emptyIcon={SquareStack}
        emptyTitle="No daemonsets found"
        emptyDescription="This namespace has no daemonsets, or the cluster is empty."
        skeletonColumns={7}
      >
        {(filtered) => (
          <DaemonSetTable daemonsets={filtered} namespaceFilter={namespaceFilter} onSelect={handleSelect} />
        )}
      </ResourcePage>

      {drawerOpen && (
        <DaemonSetDetailsDrawer
          daemonSet={selectedDaemonSet}
          loading={selectedDaemonSetStatus === 'loading'}
          onClose={handleClose}
        />
      )}
    </>
  )
}
