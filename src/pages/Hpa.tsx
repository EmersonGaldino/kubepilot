import { Gauge } from 'lucide-react'
import { useEffect, useState } from 'react'

import { ResourcePage } from '@/components/common/ResourcePage'
import { HpaDetailsDrawer } from '@/components/hpa/HpaDetailsDrawer'
import { HpaTable } from '@/components/hpa/HpaTable'
import { useResourceFocus } from '@/hooks/useResourceFocus'
import { useClusterStore } from '@/stores/useClusterStore'
import { useHpaStore } from '@/stores/useHpaStore'
import { useNamespaceStore } from '@/stores/useNamespaceStore'
import type { HpaSummary } from '@shared/types'

function searchText(item: HpaSummary) {
  return `${item.name} ${item.namespace} ${item.targetKind} ${item.targetName} ${item.primaryMetric}`
}

export function HorizontalPodAutoscalers() {
  const items = useHpaStore((s) => s.items)
  const status = useHpaStore((s) => s.status)
  const error = useHpaStore((s) => s.error)
  const loadHpas = useHpaStore((s) => s.loadHpas)
  const loadHpaDetail = useHpaStore((s) => s.loadHpaDetail)
  const clearSelected = useHpaStore((s) => s.clearSelected)
  const selected = useHpaStore((s) => s.selected)
  const selectedStatus = useHpaStore((s) => s.selectedStatus)
  const namespaceFilter = useNamespaceStore((s) => s.selected)
  const currentContext = useClusterStore((s) => s.currentContext)
  const refreshGeneration = useClusterStore((s) => s.refreshGeneration)
  const [drawerOpen, setDrawerOpen] = useState(false)

  useEffect(() => {
    void loadHpas(namespaceFilter)
  }, [loadHpas, namespaceFilter, currentContext, refreshGeneration])

  const handleSelect = (item: HpaSummary) => {
    setDrawerOpen(true)
    void loadHpaDetail(item.namespace, item.name)
  }

  useResourceFocus('hpa', items, (i) => i.name, handleSelect)

  const handleClose = () => {
    setDrawerOpen(false)
    clearSelected()
  }

  return (
    <>
      <ResourcePage
        title="Horizontal Pod Autoscalers"
        countNoun="HPAs"
        items={items}
        getSearchText={searchText}
        status={status}
        error={error}
        onRetry={() => void loadHpas(namespaceFilter)}
        createKind="hpa"
        onCreated={() => void loadHpas(namespaceFilter)}
        emptyIcon={Gauge}
        emptyTitle="No HPAs found"
        emptyDescription="This namespace has no HorizontalPodAutoscalers."
      >
        {(filtered) => <HpaTable items={filtered} namespaceFilter={namespaceFilter} onSelect={handleSelect} />}
      </ResourcePage>
      {drawerOpen && <HpaDetailsDrawer hpa={selected} loading={selectedStatus === 'loading'} onClose={handleClose} />}
    </>
  )
}
