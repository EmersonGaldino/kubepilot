import { RotateCw } from 'lucide-react'

import { ConnectionStatusBadge } from '@/components/common/StatusBadge'
import { NamespaceCombobox } from '@/components/common/NamespaceCombobox'
import { Button } from '@/components/ui/Button'
import { useClusterPrefsStore } from '@/stores/useClusterPrefsStore'
import { useClusterStore } from '@/stores/useClusterStore'
import { useDeploymentStore } from '@/stores/useDeploymentStore'
import { useNamespaceStore } from '@/stores/useNamespaceStore'
import { usePodStore } from '@/stores/usePodStore'

export function Topbar() {
  const clusterInfo = useClusterStore((s) => s.clusterInfo)
  const clusterAlias = useClusterPrefsStore((s) => (clusterInfo ? s.aliases[clusterInfo.contextName] : undefined))
  const refreshClusterInfo = useClusterStore((s) => s.refreshClusterInfo)
  const namespaces = useNamespaceStore((s) => s.namespaces)
  const loadNamespaces = useNamespaceStore((s) => s.loadNamespaces)
  const selectedNamespace = useNamespaceStore((s) => s.selected)
  const selectNamespace = useNamespaceStore((s) => s.select)
  const loadPods = usePodStore((s) => s.loadPods)
  const loadDeployments = useDeploymentStore((s) => s.loadDeployments)

  const refreshAll = () => {
    void refreshClusterInfo()
    void loadNamespaces()
    void loadPods(selectedNamespace)
    void loadDeployments(selectedNamespace)
  }

  return (
    <header className="flex h-12 shrink-0 items-center justify-between gap-3 border-b border-border-subtle bg-surface-0/80 px-4">
      <div className="flex min-w-0 items-center gap-3">
        <span className="truncate text-sm font-medium text-fg">
          {clusterAlias ?? clusterInfo?.contextName ?? 'No cluster selected'}
        </span>
        {clusterInfo && <ConnectionStatusBadge status={clusterInfo.status} />}
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <NamespaceCombobox namespaces={namespaces} selected={selectedNamespace} onSelect={selectNamespace} />
        <Button variant="ghost" onClick={refreshAll} title="Refresh (⌘R)">
          <RotateCw className="h-3.5 w-3.5" />
          Refresh
        </Button>
      </div>
    </header>
  )
}
