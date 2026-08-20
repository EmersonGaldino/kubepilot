import { useConfigMapStore } from './useConfigMapStore'
import { useCronJobStore } from './useCronJobStore'
import { useDaemonSetStore } from './useDaemonSetStore'
import { useDeploymentStore } from './useDeploymentStore'
import { useEventStore } from './useEventStore'
import { useHpaStore } from './useHpaStore'
import { useIngressStore } from './useIngressStore'
import { useJobStore } from './useJobStore'
import { useNamespaceStore } from './useNamespaceStore'
import { useNodeStore } from './useNodeStore'
import { usePodStore } from './usePodStore'
import { usePvcStore } from './usePvcStore'
import { usePvStore } from './usePvStore'
import { useReplicaSetStore } from './useReplicaSetStore'
import { useSecretStore } from './useSecretStore'
import { useServiceStore } from './useServiceStore'
import { useStatefulSetStore } from './useStatefulSetStore'
import { useStorageClassStore } from './useStorageClassStore'

const LOADING_LIST = { status: 'loading' as const, error: null }

/** Drops every resource list/detail so a context switch never paints the
 * previous cluster's objects. Sets list status to `loading` so the open
 * page shows a skeleton instead of a false empty state. */
export function resetAllResourceStores(): void {
  usePodStore.setState({ pods: [], selectedPod: null, selectedPodStatus: 'idle', ...LOADING_LIST })
  useDeploymentStore.setState({
    deployments: [],
    selectedDeployment: null,
    selectedDeploymentStatus: 'idle',
    ...LOADING_LIST,
  })
  useStatefulSetStore.setState({
    statefulsets: [],
    selectedStatefulSet: null,
    selectedStatefulSetStatus: 'idle',
    ...LOADING_LIST,
  })
  useDaemonSetStore.setState({
    daemonsets: [],
    selectedDaemonSet: null,
    selectedDaemonSetStatus: 'idle',
    ...LOADING_LIST,
  })
  useReplicaSetStore.setState({
    replicaSets: [],
    selectedReplicaSet: null,
    selectedReplicaSetStatus: 'idle',
    ...LOADING_LIST,
  })
  useJobStore.setState({ jobs: [], selectedJob: null, selectedJobStatus: 'idle', ...LOADING_LIST })
  useCronJobStore.setState({ cronjobs: [], selectedCronJob: null, selectedCronJobStatus: 'idle', ...LOADING_LIST })
  useServiceStore.setState({ services: [], selectedService: null, selectedServiceStatus: 'idle', ...LOADING_LIST })
  useConfigMapStore.setState({
    configMaps: [],
    selectedConfigMap: null,
    selectedConfigMapStatus: 'idle',
    ...LOADING_LIST,
  })
  useSecretStore.setState({ secrets: [], selectedSecret: null, selectedSecretStatus: 'idle', ...LOADING_LIST })
  useEventStore.setState({ events: [], ...LOADING_LIST })
  useNodeStore.setState({ nodes: [], selectedNode: null, selectedNodeStatus: 'idle', ...LOADING_LIST })
  useIngressStore.setState({ ingresses: [], selectedIngress: null, selectedIngressStatus: 'idle', ...LOADING_LIST })
  useHpaStore.setState({ items: [], selected: null, selectedStatus: 'idle', ...LOADING_LIST })
  usePvcStore.setState({ items: [], selected: null, selectedStatus: 'idle', ...LOADING_LIST })
  usePvStore.setState({ items: [], selected: null, selectedStatus: 'idle', ...LOADING_LIST })
  useStorageClassStore.setState({ items: [], selected: null, selectedStatus: 'idle', ...LOADING_LIST })
  useNamespaceStore.setState({
    namespaces: [],
    selectedDetail: null,
    selectedDetailStatus: 'idle',
    status: 'loading',
    error: null,
  })
}
