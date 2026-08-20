import { useClusterStore } from '@/stores/useClusterStore'
import { useConfigMapStore } from '@/stores/useConfigMapStore'
import { useCronJobStore } from '@/stores/useCronJobStore'
import { useDaemonSetStore } from '@/stores/useDaemonSetStore'
import { useDeploymentStore } from '@/stores/useDeploymentStore'
import { useEventStore } from '@/stores/useEventStore'
import { useHpaStore } from '@/stores/useHpaStore'
import { useIngressStore } from '@/stores/useIngressStore'
import { useJobStore } from '@/stores/useJobStore'
import { useNamespaceStore } from '@/stores/useNamespaceStore'
import { useNodeStore } from '@/stores/useNodeStore'
import { usePodStore } from '@/stores/usePodStore'
import { usePvcStore } from '@/stores/usePvcStore'
import { usePvStore } from '@/stores/usePvStore'
import { useReplicaSetStore } from '@/stores/useReplicaSetStore'
import { useSecretStore } from '@/stores/useSecretStore'
import { useServiceStore } from '@/stores/useServiceStore'
import { useStatefulSetStore } from '@/stores/useStatefulSetStore'
import { useStorageClassStore } from '@/stores/useStorageClassStore'

/** Reloads cluster info, namespaces, and the resource backing the current
 * route. Used by the topbar Refresh button and the tray Refresh item. */
export function refreshCurrentView(pathname: string, namespace: string): void {
  const cluster = useClusterStore.getState()
  void cluster.refreshClusterInfo()
  void useNamespaceStore.getState().loadNamespaces()
  cluster.bumpRefresh()

  const path = pathname.replace(/\/+$/, '') || '/'

  if (path === '/' || path === '/pods' || path === '/logs') {
    void usePodStore.getState().loadPods(path === '/' ? 'all' : namespace)
  }
  if (path === '/' || path === '/deployments') {
    void useDeploymentStore.getState().loadDeployments(path === '/' ? 'all' : namespace)
  }
  if (path === '/') {
    void useServiceStore.getState().loadServices('all')
    return
  }

  switch (path) {
    case '/statefulsets':
      void useStatefulSetStore.getState().loadStatefulSets(namespace)
      break
    case '/daemonsets':
      void useDaemonSetStore.getState().loadDaemonSets(namespace)
      break
    case '/replicasets':
      void useReplicaSetStore.getState().loadReplicaSets(namespace)
      break
    case '/jobs':
      void useJobStore.getState().loadJobs(namespace)
      break
    case '/cronjobs':
      void useCronJobStore.getState().loadCronJobs(namespace)
      break
    case '/services':
      void useServiceStore.getState().loadServices(namespace)
      break
    case '/configmaps':
      void useConfigMapStore.getState().loadConfigMaps(namespace)
      break
    case '/secrets':
      void useSecretStore.getState().loadSecrets(namespace)
      break
    case '/events':
      void useEventStore.getState().loadEvents(namespace)
      break
    case '/nodes':
      void useNodeStore.getState().loadNodes()
      break
    case '/namespaces':
      void useNamespaceStore.getState().loadNamespaces()
      break
    case '/ingresses':
      void useIngressStore.getState().loadIngresses(namespace)
      break
    case '/hpa':
      void useHpaStore.getState().loadHpas(namespace)
      break
    case '/pvcs':
      void usePvcStore.getState().loadPvcs(namespace)
      break
    case '/pvs':
      void usePvStore.getState().loadPvs()
      break
    case '/storageclasses':
      void useStorageClassStore.getState().loadStorageClasses()
      break
    default:
      break
  }
}
