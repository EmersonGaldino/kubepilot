import { Network } from 'lucide-react'
import { useEffect, useState } from 'react'

import { ResourcePage } from '@/components/common/ResourcePage'
import { ServiceDetailsDrawer } from '@/components/services/ServiceDetailsDrawer'
import { ServiceTable } from '@/components/services/ServiceTable'
import { useNamespaceStore } from '@/stores/useNamespaceStore'
import { useServiceStore } from '@/stores/useServiceStore'
import type { ServiceSummary } from '@shared/types'

function searchText(item: ServiceSummary) {
  return `${item.name} ${item.namespace} ${item.type} ${item.clusterIP ?? ''} ${item.ports}`
}

export function Services() {
  const services = useServiceStore((s) => s.services)
  const status = useServiceStore((s) => s.status)
  const error = useServiceStore((s) => s.error)
  const loadServices = useServiceStore((s) => s.loadServices)
  const loadServiceDetail = useServiceStore((s) => s.loadServiceDetail)
  const clearSelectedService = useServiceStore((s) => s.clearSelectedService)
  const selectedService = useServiceStore((s) => s.selectedService)
  const selectedServiceStatus = useServiceStore((s) => s.selectedServiceStatus)

  const namespaceFilter = useNamespaceStore((s) => s.selected)

  const [drawerOpen, setDrawerOpen] = useState(false)

  useEffect(() => {
    void loadServices(namespaceFilter)
  }, [loadServices, namespaceFilter])

  const handleSelect = (service: ServiceSummary) => {
    setDrawerOpen(true)
    void loadServiceDetail(service.namespace, service.name)
  }

  const handleClose = () => {
    setDrawerOpen(false)
    clearSelectedService()
  }

  return (
    <>
      <ResourcePage
        title="Services"
        countNoun="services"
        items={services}
        getSearchText={searchText}
        status={status}
        error={error}
        onRetry={() => void loadServices(namespaceFilter)}
        emptyIcon={Network}
        emptyTitle="No services found"
        emptyDescription="This namespace has no services, or the cluster is empty."
      >
        {(filtered) => <ServiceTable services={filtered} namespaceFilter={namespaceFilter} onSelect={handleSelect} />}
      </ResourcePage>

      {drawerOpen && <ServiceDetailsDrawer service={selectedService} loading={selectedServiceStatus === 'loading'} onClose={handleClose} />}
    </>
  )
}
