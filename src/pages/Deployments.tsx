import { SquareStack } from 'lucide-react'
import { useState } from 'react'

import { ResourcePage } from '@/components/common/ResourcePage'
import { DeploymentDetailsDrawer } from '@/components/deployments/DeploymentDetailsDrawer'
import { DeploymentTable } from '@/components/deployments/DeploymentTable'
import { useDeploymentStore } from '@/stores/useDeploymentStore'
import { useNamespaceStore } from '@/stores/useNamespaceStore'
import type { DeploymentSummary } from '@shared/types'

function deploymentSearchText(item: DeploymentSummary) {
  return `${item.name} ${item.namespace} ${item.status}`
}

export function Deployments() {
  const deployments = useDeploymentStore((s) => s.deployments)
  const status = useDeploymentStore((s) => s.status)
  const error = useDeploymentStore((s) => s.error)
  const loadDeployments = useDeploymentStore((s) => s.loadDeployments)
  const loadDeploymentDetail = useDeploymentStore((s) => s.loadDeploymentDetail)
  const clearSelectedDeployment = useDeploymentStore((s) => s.clearSelectedDeployment)
  const selectedDeployment = useDeploymentStore((s) => s.selectedDeployment)
  const selectedDeploymentStatus = useDeploymentStore((s) => s.selectedDeploymentStatus)

  const namespaceFilter = useNamespaceStore((s) => s.selected)

  const [drawerOpen, setDrawerOpen] = useState(false)

  const handleSelect = (deployment: DeploymentSummary) => {
    setDrawerOpen(true)
    void loadDeploymentDetail(deployment.namespace, deployment.name)
  }

  const handleClose = () => {
    setDrawerOpen(false)
    clearSelectedDeployment()
  }

  return (
    <>
      <ResourcePage
        title="Deployments"
        countNoun="deployments"
        items={deployments}
        getSearchText={deploymentSearchText}
        status={status}
        error={error}
        onRetry={() => void loadDeployments(namespaceFilter)}
        emptyIcon={SquareStack}
        emptyTitle="No deployments found"
        emptyDescription="This namespace has no deployments, or the cluster is empty."
      >
        {(filtered) => (
          <DeploymentTable deployments={filtered} namespaceFilter={namespaceFilter} onSelect={handleSelect} />
        )}
      </ResourcePage>

      {drawerOpen && (
        <DeploymentDetailsDrawer
          deployment={selectedDeployment}
          loading={selectedDeploymentStatus === 'loading'}
          onClose={handleClose}
        />
      )}
    </>
  )
}
