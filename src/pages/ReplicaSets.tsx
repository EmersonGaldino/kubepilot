import { Layers } from 'lucide-react'
import { useEffect, useState } from 'react'

import { ResourcePage } from '@/components/common/ResourcePage'
import { ReplicaSetDetailsDrawer } from '@/components/replicasets/ReplicaSetDetailsDrawer'
import { ReplicaSetTable } from '@/components/replicasets/ReplicaSetTable'
import { useNamespaceStore } from '@/stores/useNamespaceStore'
import { useReplicaSetStore } from '@/stores/useReplicaSetStore'
import type { ReplicaSetSummary } from '@shared/types'

function searchText(item: ReplicaSetSummary) {
  return `${item.name} ${item.namespace} ${item.status}`
}

export function ReplicaSets() {
  const replicaSets = useReplicaSetStore((s) => s.replicaSets)
  const status = useReplicaSetStore((s) => s.status)
  const error = useReplicaSetStore((s) => s.error)
  const loadReplicaSets = useReplicaSetStore((s) => s.loadReplicaSets)
  const loadReplicaSetDetail = useReplicaSetStore((s) => s.loadReplicaSetDetail)
  const clearSelectedReplicaSet = useReplicaSetStore((s) => s.clearSelectedReplicaSet)
  const selectedReplicaSet = useReplicaSetStore((s) => s.selectedReplicaSet)
  const selectedReplicaSetStatus = useReplicaSetStore((s) => s.selectedReplicaSetStatus)

  const namespaceFilter = useNamespaceStore((s) => s.selected)

  const [drawerOpen, setDrawerOpen] = useState(false)

  useEffect(() => {
    void loadReplicaSets(namespaceFilter)
  }, [loadReplicaSets, namespaceFilter])

  const handleSelect = (replicaSet: ReplicaSetSummary) => {
    setDrawerOpen(true)
    void loadReplicaSetDetail(replicaSet.namespace, replicaSet.name)
  }

  const handleClose = () => {
    setDrawerOpen(false)
    clearSelectedReplicaSet()
  }

  return (
    <>
      <ResourcePage
        title="ReplicaSets"
        countNoun="replicasets"
        items={replicaSets}
        getSearchText={searchText}
        status={status}
        error={error}
        onRetry={() => void loadReplicaSets(namespaceFilter)}
        emptyIcon={Layers}
        emptyTitle="No replicasets found"
        emptyDescription="This namespace has no replicasets, or the cluster is empty."
      >
        {(filtered) => (
          <ReplicaSetTable replicaSets={filtered} namespaceFilter={namespaceFilter} onSelect={handleSelect} />
        )}
      </ResourcePage>

      {drawerOpen && (
        <ReplicaSetDetailsDrawer
          replicaSet={selectedReplicaSet}
          loading={selectedReplicaSetStatus === 'loading'}
          onClose={handleClose}
        />
      )}
    </>
  )
}
