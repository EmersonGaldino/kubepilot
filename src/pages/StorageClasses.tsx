import { Archive } from 'lucide-react'
import { useEffect, useState } from 'react'

import { ResourcePage } from '@/components/common/ResourcePage'
import { StorageClassDetailsDrawer } from '@/components/storageclasses/StorageClassDetailsDrawer'
import { StorageClassTable } from '@/components/storageclasses/StorageClassTable'
import { useClusterStore } from '@/stores/useClusterStore'
import { useStorageClassStore } from '@/stores/useStorageClassStore'
import type { StorageClassSummary } from '@shared/types'

function searchText(item: StorageClassSummary) {
  return `${item.name} ${item.provisioner} ${item.reclaimPolicy ?? ''}`
}

export function StorageClasses() {
  const items = useStorageClassStore((s) => s.items)
  const status = useStorageClassStore((s) => s.status)
  const error = useStorageClassStore((s) => s.error)
  const loadStorageClasses = useStorageClassStore((s) => s.loadStorageClasses)
  const loadStorageClassDetail = useStorageClassStore((s) => s.loadStorageClassDetail)
  const clearSelected = useStorageClassStore((s) => s.clearSelected)
  const selected = useStorageClassStore((s) => s.selected)
  const selectedStatus = useStorageClassStore((s) => s.selectedStatus)
  const currentContext = useClusterStore((s) => s.currentContext)
  const refreshGeneration = useClusterStore((s) => s.refreshGeneration)
  const [drawerOpen, setDrawerOpen] = useState(false)

  useEffect(() => {
    void loadStorageClasses()
  }, [loadStorageClasses, currentContext, refreshGeneration])

  return (
    <>
      <ResourcePage
        title="Storage Classes"
        countNoun="storage classes"
        items={items}
        getSearchText={searchText}
        status={status}
        error={error}
        onRetry={() => void loadStorageClasses()}
        createKind="storageclass"
        onCreated={() => void loadStorageClasses()}
        emptyIcon={Archive}
        emptyTitle="No storage classes found"
        emptyDescription="This cluster has no StorageClasses, or you cannot list them."
      >
        {(filtered) => (
          <StorageClassTable
            items={filtered}
            onSelect={(item) => {
              setDrawerOpen(true)
              void loadStorageClassDetail(item.name)
            }}
          />
        )}
      </ResourcePage>
      {drawerOpen && (
        <StorageClassDetailsDrawer
          storageClass={selected}
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
