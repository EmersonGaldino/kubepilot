import { KeyRound } from 'lucide-react'
import { useEffect, useState } from 'react'

import { ResourcePage } from '@/components/common/ResourcePage'
import { SecretDetailsDrawer } from '@/components/secrets/SecretDetailsDrawer'
import { SecretTable } from '@/components/secrets/SecretTable'
import { useResourceFocus } from '@/hooks/useResourceFocus'
import { useClusterStore } from '@/stores/useClusterStore'
import { useNamespaceStore } from '@/stores/useNamespaceStore'
import { useSecretStore } from '@/stores/useSecretStore'
import type { SecretSummary } from '@shared/types'

function searchText(item: SecretSummary) {
  return `${item.name} ${item.namespace} ${item.type}`
}

export function Secrets() {
  const secrets = useSecretStore((s) => s.secrets)
  const status = useSecretStore((s) => s.status)
  const error = useSecretStore((s) => s.error)
  const loadSecrets = useSecretStore((s) => s.loadSecrets)
  const loadSecretDetail = useSecretStore((s) => s.loadSecretDetail)
  const clearSelectedSecret = useSecretStore((s) => s.clearSelectedSecret)
  const selectedSecret = useSecretStore((s) => s.selectedSecret)
  const selectedSecretStatus = useSecretStore((s) => s.selectedSecretStatus)

  const namespaceFilter = useNamespaceStore((s) => s.selected)
  const currentContext = useClusterStore((s) => s.currentContext)
  const refreshGeneration = useClusterStore((s) => s.refreshGeneration)

  const [drawerOpen, setDrawerOpen] = useState(false)

  useEffect(() => {
    void loadSecrets(namespaceFilter)
  }, [loadSecrets, namespaceFilter, currentContext, refreshGeneration])

  const handleSelect = (secret: SecretSummary) => {
    setDrawerOpen(true)
    void loadSecretDetail(secret.namespace, secret.name)
  }

  useResourceFocus('secrets', secrets, (s) => s.name, handleSelect)

  const handleClose = () => {
    setDrawerOpen(false)
    clearSelectedSecret()
  }

  return (
    <>
      <ResourcePage
        title="Secrets"
        countNoun="secrets"
        items={secrets}
        getSearchText={searchText}
        status={status}
        error={error}
        onRetry={() => void loadSecrets(namespaceFilter)}
        createKind="secret"
        onCreated={() => void loadSecrets(namespaceFilter)}
        emptyIcon={KeyRound}
        emptyTitle="No secrets found"
        emptyDescription="This namespace has no secrets, or the cluster is empty."
        skeletonColumns={5}
      >
        {(filtered) => <SecretTable secrets={filtered} namespaceFilter={namespaceFilter} onSelect={handleSelect} />}
      </ResourcePage>

      {drawerOpen && (
        <SecretDetailsDrawer secret={selectedSecret} loading={selectedSecretStatus === 'loading'} onClose={handleClose} />
      )}
    </>
  )
}
