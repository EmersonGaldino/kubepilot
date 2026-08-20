import { kubernetesApi } from '@/services/kubernetesApi'
import type { ResourceFocusKind } from '@/stores/useResourceFocusStore'

import { ALL_NAV_ITEMS } from './navigation'

type Named = { name: string; namespace: string }

export interface ResourceSearchConfig {
  kind: ResourceFocusKind
  route: string
  label: string
  list: () => Promise<Named[]>
}

/** Cluster-wide, namespace-scoped resource kinds the command palette can
 * search by name — one entry per resource page that supports deep-linking
 * via `useResourceFocus`. Node-scoped kinds (Nodes, PVs, StorageClasses)
 * aren't included since they're few enough to find via plain nav search. */
export const RESOURCE_SEARCH_KINDS: ResourceSearchConfig[] = [
  { kind: 'pods', route: '/pods', label: 'Pods', list: () => kubernetesApi.pods.list('all') },
  { kind: 'deployments', route: '/deployments', label: 'Deployments', list: () => kubernetesApi.deployments.list('all') },
  { kind: 'statefulsets', route: '/statefulsets', label: 'StatefulSets', list: () => kubernetesApi.statefulsets.list('all') },
  { kind: 'daemonsets', route: '/daemonsets', label: 'DaemonSets', list: () => kubernetesApi.daemonsets.list('all') },
  { kind: 'replicasets', route: '/replicasets', label: 'ReplicaSets', list: () => kubernetesApi.replicasets.list('all') },
  { kind: 'jobs', route: '/jobs', label: 'Jobs', list: () => kubernetesApi.jobs.list('all') },
  { kind: 'cronjobs', route: '/cronjobs', label: 'CronJobs', list: () => kubernetesApi.cronjobs.list('all') },
  { kind: 'services', route: '/services', label: 'Services', list: () => kubernetesApi.services.list('all') },
  { kind: 'ingresses', route: '/ingresses', label: 'Ingresses', list: () => kubernetesApi.ingresses.list('all') },
  { kind: 'hpa', route: '/hpa', label: 'HPA', list: () => kubernetesApi.hpa.list('all') },
  { kind: 'pvcs', route: '/pvcs', label: 'PVCs', list: () => kubernetesApi.pvcs.list('all') },
  { kind: 'configmaps', route: '/configmaps', label: 'ConfigMaps', list: () => kubernetesApi.configmaps.list('all') },
  { kind: 'secrets', route: '/secrets', label: 'Secrets', list: () => kubernetesApi.secrets.list('all') },
]

/** Reuses the Sidebar's nav icon for a route instead of re-picking one, so a
 * resource's icon in the palette always matches its page in the sidebar. */
export function iconForRoute(route: string) {
  return ALL_NAV_ITEMS.find((item) => item.to === route)?.icon
}
