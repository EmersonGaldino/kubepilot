import { AlertCircle, Boxes, Layers, Network, ServerCog, SquareStack } from 'lucide-react'
import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'

import { ErrorState } from '@/components/common/ErrorState'
import { ProviderIcon } from '@/components/common/ProviderIcon'
import { Skeleton } from '@/components/common/Skeleton'
import { ConnectionStatusBadge, PodPhaseBadge } from '@/components/common/StatusBadge'
import { StatCard } from '@/components/common/StatCard'
import { useAllDeployments } from '@/hooks/useAllDeployments'
import { useAllPods } from '@/hooks/useAllPods'
import { useAllServices } from '@/hooks/useAllServices'
import type { LogsPageTarget } from '@/pages/Logs'
import { useClusterPrefsStore } from '@/stores/useClusterPrefsStore'
import { useClusterStore } from '@/stores/useClusterStore'
import type { ClusterProvider } from '@shared/types'

const PROVIDER_LABEL: Record<ClusterProvider, string> = {
  aks: 'Azure Kubernetes Service',
  gke: 'Google Kubernetes Engine',
  eks: 'Amazon EKS',
  local: 'Local cluster',
  unknown: 'Kubernetes',
}

export function Dashboard() {
  const navigate = useNavigate()
  const clusterInfo = useClusterStore((s) => s.clusterInfo)
  const infoStatus = useClusterStore((s) => s.infoStatus)
  const error = useClusterStore((s) => s.error)
  const refreshClusterInfo = useClusterStore((s) => s.refreshClusterInfo)
  const clusterAlias = useClusterPrefsStore((s) => (clusterInfo ? s.aliases[clusterInfo.contextName] : undefined))

  const { pods, status: podsStatus, refresh: refreshPods } = useAllPods(clusterInfo?.contextName ?? null)
  const { deployments, status: deploymentsStatus } = useAllDeployments(clusterInfo?.contextName ?? null)
  const { services, status: servicesStatus } = useAllServices(clusterInfo?.contextName ?? null)

  const podBreakdown = useMemo(() => {
    const running = pods.filter((p) => p.phase === 'Running').length
    const pending = pods.filter((p) => p.phase === 'Pending').length
    const failed = pods.filter((p) => p.phase === 'Failed').length
    return { total: pods.length, running, pending, failed }
  }, [pods])

  const deploymentBreakdown = useMemo(() => {
    const unavailable = deployments.filter((d) => d.status === 'Unavailable').length
    const updating = deployments.filter((d) => d.status === 'Updating').length
    return { total: deployments.length, unavailable, updating }
  }, [deployments])

  const perNamespace = useMemo(() => {
    const counts = new Map<string, number>()
    for (const pod of pods) counts.set(pod.namespace, (counts.get(pod.namespace) ?? 0) + 1)
    return Array.from(counts.entries()).sort((a, b) => b[1] - a[1])
  }, [pods])

  const maxNamespaceCount = perNamespace[0]?.[1] ?? 1

  const problemPods = useMemo(
    () =>
      pods
        .filter((p) => p.phase === 'Failed' || p.phase === 'Pending' || p.restarts > 3)
        .sort((a, b) => b.restarts - a.restarts)
        .slice(0, 8),
    [pods],
  )

  if (infoStatus === 'error' && error) {
    return <ErrorState message={error} onRetry={() => void refreshClusterInfo()} />
  }

  if (infoStatus === 'loading') {
    return <DashboardSkeleton />
  }

  if (!clusterInfo) {
    return <ErrorState message="Select a cluster from the sidebar to see its dashboard." />
  }

  const openPodLogs = (namespace: string, podName: string) => {
    const target: LogsPageTarget = { namespace, podName }
    navigate('/logs', { state: target })
  }

  return (
    <div className="min-h-0 flex-1 space-y-6 overflow-y-auto p-6">
      <section className="kp-card p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-lg font-semibold tracking-tight text-fg">{clusterAlias ?? clusterInfo.contextName}</h1>
            <p className="mt-1 flex items-center gap-1.5 text-sm text-fg-muted">
              <ProviderIcon provider={clusterInfo.provider} />
              {PROVIDER_LABEL[clusterInfo.provider]}
            </p>
          </div>
          <ConnectionStatusBadge status={clusterInfo.status} />
        </div>
        <dl className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <HeroField label="Kubernetes version" value={clusterInfo.kubernetesVersion ?? '—'} />
          <HeroField label="API Server" value={clusterInfo.server || '—'} title={clusterInfo.server} />
          <HeroField
            label="Nodes"
            value={clusterInfo.nodeCount ?? '—'}
            title={clusterInfo.nodeCount === null ? 'No permission to list nodes' : undefined}
          />
          <HeroField label="Namespaces" value={clusterInfo.namespaceCount ?? '—'} />
        </dl>
      </section>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <StatCard
          label="Pods"
          value={podsStatus === 'loading' ? '—' : podBreakdown.total}
          icon={Boxes}
          to="/pods"
          tone={podBreakdown.failed > 0 ? 'danger' : podBreakdown.pending > 0 ? 'warning' : 'default'}
          breakdown={[
            { label: 'Running', value: podBreakdown.running },
            { label: 'Pending', value: podBreakdown.pending, tone: 'warning' },
            { label: 'Failed', value: podBreakdown.failed, tone: 'danger' },
          ]}
        />
        <StatCard label="Nodes" value={clusterInfo.nodeCount ?? '—'} icon={ServerCog} />
        <StatCard label="Namespaces" value={clusterInfo.namespaceCount ?? '—'} icon={Layers} />
        <StatCard
          label="Deployments"
          value={deploymentsStatus === 'loading' ? '—' : deploymentBreakdown.total}
          icon={SquareStack}
          to="/deployments"
          tone={deploymentBreakdown.unavailable > 0 ? 'danger' : deploymentBreakdown.updating > 0 ? 'warning' : 'default'}
          breakdown={[
            { label: 'Updating', value: deploymentBreakdown.updating, tone: 'warning' },
            { label: 'Unavailable', value: deploymentBreakdown.unavailable, tone: 'danger' },
          ]}
        />
        <StatCard
          label="Services"
          value={servicesStatus === 'loading' ? '—' : services.length}
          icon={Network}
          to="/services"
        />
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="kp-card">
          <h2 className="border-b border-border-subtle px-4 py-3 text-sm font-medium text-fg">Pods per namespace</h2>
          <div className="divide-y divide-border-subtle">
            {podsStatus === 'loading' ? (
              <ListRowsSkeleton rows={4} />
            ) : (
              <>
                {perNamespace.length === 0 && <p className="px-4 py-6 text-sm text-fg-subtle">No pods found.</p>}
                {perNamespace.slice(0, 12).map(([namespace, count]) => (
                  <div key={namespace} className="flex items-center gap-3 px-4 py-2.5 text-sm">
                    <span className="w-36 shrink-0 truncate text-fg" title={namespace}>
                      {namespace}
                    </span>
                    <div className="h-1.5 min-w-0 flex-1 rounded-full bg-white/[0.06]">
                      <div
                        className="h-full rounded-full bg-accent/80"
                        style={{ width: `${Math.max(6, (count / maxNamespaceCount) * 100)}%` }}
                      />
                    </div>
                    <span className="w-8 shrink-0 text-right font-medium tabular-nums text-fg-muted">{count}</span>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>

        <div className="kp-card">
          <h2 className="flex items-center gap-1.5 border-b border-border-subtle px-4 py-3 text-sm font-medium text-fg">
            <AlertCircle className="h-4 w-4 text-warning" />
            Pods with problems
          </h2>
          <div className="divide-y divide-border-subtle">
            {podsStatus === 'loading' ? (
              <ListRowsSkeleton rows={4} />
            ) : (
              <>
                {problemPods.length === 0 && (
                  <p className="px-4 py-6 text-sm text-fg-subtle">Nothing unusual — all pods look healthy.</p>
                )}
                {problemPods.map((pod) => (
                  <button
                    key={`${pod.namespace}/${pod.name}`}
                    type="button"
                    onClick={() => openPodLogs(pod.namespace, pod.name)}
                    className="flex w-full items-center justify-between px-4 py-2.5 text-left text-sm transition-colors duration-150 hover:bg-white/[0.04]"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-fg">{pod.name}</p>
                      <p className="text-xs text-fg-subtle">{pod.namespace}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {pod.restarts > 0 && <span className="text-xs tabular-nums text-fg-muted">{pod.restarts} restarts</span>}
                      <PodPhaseBadge phase={pod.phase} />
                    </div>
                  </button>
                ))}
              </>
            )}
          </div>
        </div>
      </section>

      {podsStatus === 'error' && <ErrorState message="Failed to load pods for this cluster." onRetry={() => void refreshPods()} />}
    </div>
  )
}

function HeroField({ label, value, title }: { label: string; value: string | number; title?: string }) {
  return (
    <div>
      <dt className="text-xs text-fg-subtle">{label}</dt>
      <dd className="mt-0.5 truncate text-sm text-fg" title={title ?? String(value)}>
        {value}
      </dd>
    </div>
  )
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6 p-6">
      <Skeleton className="h-28 rounded-xl" />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Skeleton className="h-48 rounded-xl" />
        <Skeleton className="h-48 rounded-xl" />
      </div>
    </div>
  )
}

function ListRowsSkeleton({ rows }: { rows: number }) {
  return (
    <div className="space-y-2 p-4">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-4 w-full" />
      ))}
    </div>
  )
}
