import { Globe } from 'lucide-react'
import { useEffect, useState } from 'react'

import { ResourcePage } from '@/components/common/ResourcePage'
import { IngressDetailsDrawer } from '@/components/ingresses/IngressDetailsDrawer'
import { IngressTable } from '@/components/ingresses/IngressTable'
import { useResourceFocus } from '@/hooks/useResourceFocus'
import { useClusterStore } from '@/stores/useClusterStore'
import { useIngressStore } from '@/stores/useIngressStore'
import { useNamespaceStore } from '@/stores/useNamespaceStore'
import type { IngressSummary } from '@shared/types'

function searchText(item: IngressSummary) {
  return `${item.name} ${item.namespace} ${item.hosts} ${item.address ?? ''} ${item.className ?? ''}`
}

export function Ingresses() {
  const ingresses = useIngressStore((s) => s.ingresses)
  const status = useIngressStore((s) => s.status)
  const error = useIngressStore((s) => s.error)
  const loadIngresses = useIngressStore((s) => s.loadIngresses)
  const loadIngressDetail = useIngressStore((s) => s.loadIngressDetail)
  const clearSelectedIngress = useIngressStore((s) => s.clearSelectedIngress)
  const selectedIngress = useIngressStore((s) => s.selectedIngress)
  const selectedIngressStatus = useIngressStore((s) => s.selectedIngressStatus)
  const namespaceFilter = useNamespaceStore((s) => s.selected)
  const currentContext = useClusterStore((s) => s.currentContext)
  const refreshGeneration = useClusterStore((s) => s.refreshGeneration)
  const [drawerOpen, setDrawerOpen] = useState(false)

  useEffect(() => {
    void loadIngresses(namespaceFilter)
  }, [loadIngresses, namespaceFilter, currentContext, refreshGeneration])

  const handleSelect = (item: IngressSummary) => {
    setDrawerOpen(true)
    void loadIngressDetail(item.namespace, item.name)
  }

  useResourceFocus('ingresses', ingresses, (i) => i.name, handleSelect)

  const handleClose = () => {
    setDrawerOpen(false)
    clearSelectedIngress()
  }

  return (
    <>
      <ResourcePage
        title="Ingresses"
        countNoun="ingresses"
        items={ingresses}
        getSearchText={searchText}
        status={status}
        error={error}
        onRetry={() => void loadIngresses(namespaceFilter)}
        createKind="ingress"
        onCreated={() => void loadIngresses(namespaceFilter)}
        emptyIcon={Globe}
        emptyTitle="No ingresses found"
        emptyDescription="This namespace has no Ingress objects."
      >
        {(filtered) => <IngressTable ingresses={filtered} namespaceFilter={namespaceFilter} onSelect={handleSelect} />}
      </ResourcePage>
      {drawerOpen && (
        <IngressDetailsDrawer ingress={selectedIngress} loading={selectedIngressStatus === 'loading'} onClose={handleClose} />
      )}
    </>
  )
}
