import { RotateCw } from 'lucide-react'
import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

import { ConnectionStatusBadge } from '@/components/common/StatusBadge'
import { NamespaceCombobox } from '@/components/common/NamespaceCombobox'
import { Button } from '@/components/ui/Button'
import { refreshCurrentView } from '@/lib/refreshCurrentView'
import { useClusterPrefsStore } from '@/stores/useClusterPrefsStore'
import { useClusterStore } from '@/stores/useClusterStore'
import { useNamespaceStore } from '@/stores/useNamespaceStore'

export function Topbar() {
  const { pathname } = useLocation()
  const clusterInfo = useClusterStore((s) => s.clusterInfo)
  const clusterAlias = useClusterPrefsStore((s) => (clusterInfo ? s.aliases[clusterInfo.contextName] : undefined))
  const namespaces = useNamespaceStore((s) => s.namespaces)
  const selectedNamespace = useNamespaceStore((s) => s.selected)
  const selectNamespace = useNamespaceStore((s) => s.select)

  const refresh = () => refreshCurrentView(pathname, selectedNamespace)

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'r') {
        event.preventDefault()
        refreshCurrentView(pathname, selectedNamespace)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [pathname, selectedNamespace])

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
        <Button variant="ghost" onClick={refresh} title="Refresh (⌘R)">
          <RotateCw className="h-3.5 w-3.5" />
          Refresh
        </Button>
      </div>
    </header>
  )
}
