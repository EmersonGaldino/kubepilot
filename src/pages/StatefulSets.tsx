import { Database } from 'lucide-react'
import { useEffect, useState } from 'react'

import { ResourcePage } from '@/components/common/ResourcePage'
import { StatefulSetDetailsDrawer } from '@/components/statefulsets/StatefulSetDetailsDrawer'
import { StatefulSetTable } from '@/components/statefulsets/StatefulSetTable'
import { useNamespaceStore } from '@/stores/useNamespaceStore'
import { useStatefulSetStore } from '@/stores/useStatefulSetStore'
import type { StatefulSetSummary } from '@shared/types'

function searchText(item: StatefulSetSummary) {
  return `${item.name} ${item.namespace} ${item.status}`
}

export function StatefulSets() {
  const statefulsets = useStatefulSetStore((s) => s.statefulsets)
  const status = useStatefulSetStore((s) => s.status)
  const error = useStatefulSetStore((s) => s.error)
  const loadStatefulSets = useStatefulSetStore((s) => s.loadStatefulSets)
  const loadStatefulSetDetail = useStatefulSetStore((s) => s.loadStatefulSetDetail)
  const clearSelectedStatefulSet = useStatefulSetStore((s) => s.clearSelectedStatefulSet)
  const selectedStatefulSet = useStatefulSetStore((s) => s.selectedStatefulSet)
  const selectedStatefulSetStatus = useStatefulSetStore((s) => s.selectedStatefulSetStatus)

  const namespaceFilter = useNamespaceStore((s) => s.selected)

  const [drawerOpen, setDrawerOpen] = useState(false)

  useEffect(() => {
    void loadStatefulSets(namespaceFilter)
  }, [namespaceFilter, loadStatefulSets])

  const handleSelect = (statefulSet: StatefulSetSummary) => {
    setDrawerOpen(true)
    void loadStatefulSetDetail(statefulSet.namespace, statefulSet.name)
  }

  const handleClose = () => {
    setDrawerOpen(false)
    clearSelectedStatefulSet()
  }

  return (
    <>
      <ResourcePage
        title="StatefulSets"
        countNoun="statefulsets"
        items={statefulsets}
        getSearchText={searchText}
        status={status}
        error={error}
        onRetry={() => void loadStatefulSets(namespaceFilter)}
        emptyIcon={Database}
        emptyTitle="No statefulsets found"
        emptyDescription="This namespace has no statefulsets, or the cluster is empty."
      >
        {(filtered) => (
          <StatefulSetTable statefulsets={filtered} namespaceFilter={namespaceFilter} onSelect={handleSelect} />
        )}
      </ResourcePage>

      {drawerOpen && (
        <StatefulSetDetailsDrawer
          statefulSet={selectedStatefulSet}
          loading={selectedStatefulSetStatus === 'loading'}
          onClose={handleClose}
        />
      )}
    </>
  )
}
