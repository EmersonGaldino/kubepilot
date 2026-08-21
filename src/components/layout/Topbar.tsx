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
  const profile = useClusterPrefsStore((s) => (clusterInfo ? s.profiles[clusterInfo.contextName] : undefined))
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
    <header className="relative z-40 flex h-12 shrink-0 items-center justify-between gap-3 border-b border-border-subtle bg-surface-0/95 px-4 backdrop-blur-xl">
      <div className="flex min-w-0 items-center gap-3">
        <span className="truncate text-sm font-medium text-fg">
          {clusterAlias ?? clusterInfo?.contextName ?? 'No cluster selected'}
        </span>
        {profile && <ClusterProfileBadge profile={profile} />}
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

function ClusterProfileBadge({ profile }: { profile: 'production' | 'staging' | 'development' }) {
  const label = profile === 'production' ? 'PRODUCTION' : profile === 'staging' ? 'STAGING' : 'DEVELOPMENT'
  const className = profile === 'production' ? 'border-red-500/35 bg-red-500/10 text-red-300' : profile === 'staging' ? 'border-amber-500/35 bg-amber-500/10 text-amber-300' : 'border-blue-500/35 bg-blue-500/10 text-blue-300'
  return <span className={`rounded border px-1.5 py-0.5 text-[10px] font-semibold tracking-wide ${className}`}>{label}</span>
}
