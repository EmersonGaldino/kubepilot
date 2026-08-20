import { Database } from 'lucide-react'
import { useEffect, useState } from 'react'

import { ResourcePage } from '@/components/common/ResourcePage'
import { PvDetailsDrawer } from '@/components/pvs/PvDetailsDrawer'
import { PvTable } from '@/components/pvs/PvTable'
import { useClusterStore } from '@/stores/useClusterStore'
import { usePvStore } from '@/stores/usePvStore'
import type { PvSummary } from '@shared/types'

function searchText(item: PvSummary) {
  return `${item.name} ${item.status} ${item.claimRef ?? ''} ${item.storageClass ?? ''}`
}

export function PersistentVolumes() {
  const items = usePvStore((s) => s.items)
  const status = usePvStore((s) => s.status)
  const error = usePvStore((s) => s.error)
  const loadPvs = usePvStore((s) => s.loadPvs)
  const loadPvDetail = usePvStore((s) => s.loadPvDetail)
  const clearSelected = usePvStore((s) => s.clearSelected)
  const selected = usePvStore((s) => s.selected)
  const selectedStatus = usePvStore((s) => s.selectedStatus)
  const currentContext = useClusterStore((s) => s.currentContext)
  const refreshGeneration = useClusterStore((s) => s.refreshGeneration)
  const [drawerOpen, setDrawerOpen] = useState(false)

  useEffect(() => {
    void loadPvs()
  }, [loadPvs, currentContext, refreshGeneration])

  return (
    <>
      <ResourcePage
        title="Persistent Volumes"
        countNoun="PVs"
        items={items}
        getSearchText={searchText}
        status={status}
        error={error}
        onRetry={() => void loadPvs()}
        createKind="persistentvolume"
        onCreated={() => void loadPvs()}
        emptyIcon={Database}
        emptyTitle="No persistent volumes found"
        emptyDescription="This cluster has no PersistentVolumes, or you cannot list them."
      >
        {(filtered) => (
          <PvTable
            items={filtered}
            onSelect={(item) => {
              setDrawerOpen(true)
              void loadPvDetail(item.name)
            }}
          />
        )}
      </ResourcePage>
      {drawerOpen && (
        <PvDetailsDrawer
          pv={selected}
          loading={selectedStatus === 'loading'}
          onClose={() => {
            setDrawerOpen(false)
            clearSelected()
          }}
        />
      )}
    </>
  )
}
