import { HardDrive } from 'lucide-react'
import { useEffect, useState } from 'react'

import { ResourcePage } from '@/components/common/ResourcePage'
import { PvcDetailsDrawer } from '@/components/pvcs/PvcDetailsDrawer'
import { PvcTable } from '@/components/pvcs/PvcTable'
import { useResourceFocus } from '@/hooks/useResourceFocus'
import { useClusterStore } from '@/stores/useClusterStore'
import { useNamespaceStore } from '@/stores/useNamespaceStore'
import { usePvcStore } from '@/stores/usePvcStore'
import type { PvcSummary } from '@shared/types'

function searchText(item: PvcSummary) {
  return `${item.name} ${item.namespace} ${item.phase} ${item.volumeName ?? ''} ${item.storageClass ?? ''}`
}

export function PersistentVolumeClaims() {
  const items = usePvcStore((s) => s.items)
  const status = usePvcStore((s) => s.status)
  const error = usePvcStore((s) => s.error)
  const loadPvcs = usePvcStore((s) => s.loadPvcs)
  const loadPvcDetail = usePvcStore((s) => s.loadPvcDetail)
  const clearSelected = usePvcStore((s) => s.clearSelected)
  const selected = usePvcStore((s) => s.selected)
  const selectedStatus = usePvcStore((s) => s.selectedStatus)
  const namespaceFilter = useNamespaceStore((s) => s.selected)
  const currentContext = useClusterStore((s) => s.currentContext)
  const refreshGeneration = useClusterStore((s) => s.refreshGeneration)
  const [drawerOpen, setDrawerOpen] = useState(false)

  useEffect(() => {
    void loadPvcs(namespaceFilter)
  }, [loadPvcs, namespaceFilter, currentContext, refreshGeneration])

  const handleSelect = (item: PvcSummary) => {
    setDrawerOpen(true)
    void loadPvcDetail(item.namespace, item.name)
  }

  useResourceFocus('pvcs', items, (i) => i.name, handleSelect)

  const handleClose = () => {
    setDrawerOpen(false)
    clearSelected()
  }

  return (
    <>
      <ResourcePage
        title="Persistent Volume Claims"
        countNoun="PVCs"
        items={items}
        getSearchText={searchText}
        status={status}
        error={error}
        onRetry={() => void loadPvcs(namespaceFilter)}
        createKind="persistentvolumeclaim"
        onCreated={() => void loadPvcs(namespaceFilter)}
        emptyIcon={HardDrive}
        emptyTitle="No PVCs found"
        emptyDescription="This namespace has no PersistentVolumeClaims."
      >
        {(filtered) => <PvcTable items={filtered} namespaceFilter={namespaceFilter} onSelect={handleSelect} />}
      </ResourcePage>
      {drawerOpen && <PvcDetailsDrawer pvc={selected} loading={selectedStatus === 'loading'} onClose={handleClose} />}
    </>
  )
}
