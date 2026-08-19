import { FileText } from 'lucide-react'
import { useEffect, useState } from 'react'

import { ResourcePage } from '@/components/common/ResourcePage'
import { ConfigMapDetailsDrawer } from '@/components/configmaps/ConfigMapDetailsDrawer'
import { ConfigMapTable } from '@/components/configmaps/ConfigMapTable'
import { useConfigMapStore } from '@/stores/useConfigMapStore'
import { useNamespaceStore } from '@/stores/useNamespaceStore'
import type { ConfigMapSummary } from '@shared/types'

function searchText(item: ConfigMapSummary) {
  return `${item.name} ${item.namespace}`
}

export function ConfigMaps() {
  const configMaps = useConfigMapStore((s) => s.configMaps)
  const status = useConfigMapStore((s) => s.status)
  const error = useConfigMapStore((s) => s.error)
  const loadConfigMaps = useConfigMapStore((s) => s.loadConfigMaps)
  const loadConfigMapDetail = useConfigMapStore((s) => s.loadConfigMapDetail)
  const clearSelectedConfigMap = useConfigMapStore((s) => s.clearSelectedConfigMap)
  const selectedConfigMap = useConfigMapStore((s) => s.selectedConfigMap)
  const selectedConfigMapStatus = useConfigMapStore((s) => s.selectedConfigMapStatus)

  const namespaceFilter = useNamespaceStore((s) => s.selected)

  const [drawerOpen, setDrawerOpen] = useState(false)

  useEffect(() => {
    void loadConfigMaps(namespaceFilter)
  }, [loadConfigMaps, namespaceFilter])

  const handleSelect = (configMap: ConfigMapSummary) => {
    setDrawerOpen(true)
    void loadConfigMapDetail(configMap.namespace, configMap.name)
  }

  const handleClose = () => {
    setDrawerOpen(false)
    clearSelectedConfigMap()
  }

  return (
    <>
      <ResourcePage
        title="ConfigMaps"
        countNoun="configmaps"
        items={configMaps}
        getSearchText={searchText}
        status={status}
        error={error}
        onRetry={() => void loadConfigMaps(namespaceFilter)}
        emptyIcon={FileText}
        emptyTitle="No configmaps found"
        emptyDescription="This namespace has no configmaps, or the cluster is empty."
        skeletonColumns={4}
      >
        {(filtered) => (
          <ConfigMapTable configMaps={filtered} namespaceFilter={namespaceFilter} onSelect={handleSelect} />
        )}
      </ResourcePage>

      {drawerOpen && (
        <ConfigMapDetailsDrawer
          configMap={selectedConfigMap}
          loading={selectedConfigMapStatus === 'loading'}
          onClose={handleClose}
        />
      )}
    </>
  )
}
