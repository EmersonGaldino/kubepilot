import { Layers } from 'lucide-react'
import { useEffect, useState } from 'react'

import { ResourcePage } from '@/components/common/ResourcePage'
import { CreateNamespaceDialog, NamespaceDetailsDrawer } from '@/components/namespaces/NamespaceDetailsDrawer'
import { NamespaceTable } from '@/components/namespaces/NamespaceTable'
import { Button } from '@/components/ui/Button'
import { useClusterStore } from '@/stores/useClusterStore'
import { useNamespaceStore } from '@/stores/useNamespaceStore'
import type { NamespaceSummary } from '@shared/types'

function searchText(ns: NamespaceSummary) {
  return `${ns.name} ${ns.status} ${Object.entries(ns.labels)
    .map(([k, v]) => `${k}=${v}`)
    .join(' ')}`
}

export function NamespacesPage() {
  const namespaces = useNamespaceStore((s) => s.namespaces)
  const status = useNamespaceStore((s) => s.status)
  const error = useNamespaceStore((s) => s.error)
  const loadNamespaces = useNamespaceStore((s) => s.loadNamespaces)
  const loadNamespaceDetail = useNamespaceStore((s) => s.loadNamespaceDetail)
  const clearSelectedDetail = useNamespaceStore((s) => s.clearSelectedDetail)
  const selectedDetail = useNamespaceStore((s) => s.selectedDetail)
  const selectedDetailStatus = useNamespaceStore((s) => s.selectedDetailStatus)
  const currentContext = useClusterStore((s) => s.currentContext)
  const refreshGeneration = useClusterStore((s) => s.refreshGeneration)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)

  useEffect(() => {
    void loadNamespaces()
  }, [loadNamespaces, currentContext, refreshGeneration])

  return (
    <>
      <ResourcePage
        title="Namespaces"
        countNoun="namespaces"
        items={namespaces}
        getSearchText={searchText}
        status={status}
        error={error}
        onRetry={() => void loadNamespaces()}
        createKind="namespace"
        onCreated={() => void loadNamespaces()}
        toolbar={
          <Button variant="secondary" onClick={() => setCreateOpen(true)}>
            New
          </Button>
        }
        emptyIcon={Layers}
        emptyTitle="No namespaces found"
        emptyDescription="Your credentials cannot list namespaces, or the cluster has none."
      >
        {(filtered) => (
          <NamespaceTable
            namespaces={filtered}
            onSelect={(ns) => {
              setDrawerOpen(true)
              void loadNamespaceDetail(ns.name)
            }}
          />
        )}
      </ResourcePage>
      {drawerOpen && (
        <NamespaceDetailsDrawer
          namespace={selectedDetail}
          loading={selectedDetailStatus === 'loading'}
          onClose={() => {
            setDrawerOpen(false)
            clearSelectedDetail()
          }}
        />
      )}
      <CreateNamespaceDialog open={createOpen} onClose={() => setCreateOpen(false)} />
    </>
  )
}
