/**
 * Domain types shared between the Electron main process and the React
 * renderer. This file must never import Node.js or Electron APIs — it is
 * consumed by the renderer bundle purely as type information.
 */

export type ConnectionStatus = 'connected' | 'connecting' | 'disconnected' | 'error'

/**
 * Best-effort provider classification, derived from context/cluster naming
 * conventions. Purely cosmetic (grouping in the sidebar) — KubePilot never
 * branches its Kubernetes API calls based on this value.
 */
export type ClusterProvider = 'aks' | 'gke' | 'eks' | 'local' | 'unknown'

export interface KubeContext {
  name: string
  clusterName: string
  userName: string
  namespace: string | null
  isCurrent: boolean
  provider: ClusterProvider
}

export interface ClusterInfo {
  contextName: string
  clusterName: string
  provider: ClusterProvider
  server: string
  kubernetesVersion: string | null
  status: ConnectionStatus
  /** `null` means "couldn't be determined" (e.g. the current user/service
   * account lacks RBAC/IAM permission to list nodes cluster-wide) — distinct
   * from `0`, which means the API call succeeded and the cluster truly has
   * none. */
  nodeCount: number | null
  namespaceCount: number | null
}

export interface NamespaceSummary {
  name: string
  status: string
  age: string | null
}

export type PodPhase = 'Running' | 'Pending' | 'Succeeded' | 'Failed' | 'Unknown'

export interface PodSummary {
  name: string
  namespace: string
  phase: PodPhase
  ready: string
  restarts: number
  age: string | null
  node: string | null
  podIP: string | null
}

export interface ContainerInfo {
  name: string
  image: string
  ready: boolean
  restartCount: number
  state: string
}

export interface PodDetail extends PodSummary {
  createdAt: string | null
  labels: Record<string, string>
  containers: ContainerInfo[]
  ownerKind: string | null
  ownerName: string | null
}

export interface LogsFetchParams {
  namespace: string
  podName: string
  containerName?: string
  tailLines?: number
  timestamps?: boolean
  sinceSeconds?: number
}

/** Derived from replica counts + status conditions — `@kubernetes/client-node`
 * doesn't expose a single "phase" field for Deployments/StatefulSets/DaemonSets
 * the way it does for Pods, so KubePilot classifies one itself for the status
 * badge, shared across every controller-managed workload type. */
export type WorkloadStatus = 'Available' | 'Updating' | 'Unavailable' | 'ScaledToZero'

export interface DeploymentSummary {
  name: string
  namespace: string
  status: WorkloadStatus
  /** `"ready/desired"` replica ratio, e.g. `"2/3"`. */
  ready: string
  desiredReplicas: number
  updatedReplicas: number
  availableReplicas: number
  age: string | null
}

export interface DeploymentDetail extends DeploymentSummary {
  createdAt: string | null
  labels: Record<string, string>
  selector: Record<string, string>
  strategy: string
  containers: { name: string; image: string }[]
  conditions: { type: string; status: string; message: string | null }[]
}

export interface StatefulSetSummary {
  name: string
  namespace: string
  status: WorkloadStatus
  /** `"ready/desired"` replica ratio, e.g. `"2/3"`. */
  ready: string
  desiredReplicas: number
  updatedReplicas: number
  availableReplicas: number
  age: string | null
}

export interface StatefulSetDetail extends StatefulSetSummary {
  createdAt: string | null
  labels: Record<string, string>
  selector: Record<string, string>
  serviceName: string | null
  containers: { name: string; image: string }[]
  conditions: { type: string; status: string; message: string | null }[]
}

export interface DaemonSetSummary {
  name: string
  namespace: string
  status: WorkloadStatus
  /** `"ready/desired"` node-scheduling ratio, e.g. `"2/3"` — DaemonSets have
   * no user-set replica count, "desired" is however many nodes match its
   * node selector/tolerations. */
  ready: string
  desiredScheduled: number
  updatedScheduled: number
  availableScheduled: number
  age: string | null
}

export interface DaemonSetDetail extends DaemonSetSummary {
  createdAt: string | null
  labels: Record<string, string>
  selector: Record<string, string>
  containers: { name: string; image: string }[]
  conditions: { type: string; status: string; message: string | null }[]
}

export interface DashboardCounts {
  podsTotal: number
  podsRunning: number
  podsPending: number
  podsFailed: number
  nodeCount: number
  namespaceCount: number
}

export interface ReplicaSetSummary {
  name: string
  namespace: string
  status: WorkloadStatus
  /** `"ready/desired"` replica ratio, e.g. `"2/3"`. */
  ready: string
  desiredReplicas: number
  availableReplicas: number
  age: string | null
}

export interface ReplicaSetDetail extends ReplicaSetSummary {
  createdAt: string | null
  labels: Record<string, string>
  selector: Record<string, string>
  containers: { name: string; image: string }[]
  ownerKind: string | null
  ownerName: string | null
}

export type JobStatus = 'Complete' | 'Running' | 'Failed'

export interface JobSummary {
  name: string
  namespace: string
  status: JobStatus
  /** `"succeeded/completions"`, e.g. `"1/1"`. */
  completions: string
  active: number
  age: string | null
}

export interface JobDetail extends JobSummary {
  createdAt: string | null
  completedAt: string | null
  labels: Record<string, string>
  containers: { name: string; image: string }[]
  conditions: { type: string; status: string; message: string | null }[]
}

export interface CronJobSummary {
  name: string
  namespace: string
  schedule: string
  suspended: boolean
  active: number
  lastScheduleTime: string | null
  age: string | null
}

export interface CronJobDetail extends CronJobSummary {
  createdAt: string | null
  labels: Record<string, string>
  concurrencyPolicy: string
  containers: { name: string; image: string }[]
}

export interface ServicePort {
  name: string | null
  port: number
  targetPort: string | null
  protocol: string
  nodePort: number | null
}

export interface ServiceSummary {
  name: string
  namespace: string
  type: string
  clusterIP: string | null
  externalIP: string | null
  ports: string
  age: string | null
}

export interface ServiceDetail extends ServiceSummary {
  createdAt: string | null
  labels: Record<string, string>
  selector: Record<string, string>
  portList: ServicePort[]
}

export interface ConfigMapSummary {
  name: string
  namespace: string
  keyCount: number
  age: string | null
}

export interface ConfigMapDetail extends ConfigMapSummary {
  createdAt: string | null
  labels: Record<string, string>
  data: { key: string; value: string }[]
}

export interface SecretSummary {
  name: string
  namespace: string
  type: string
  keyCount: number
  age: string | null
}

/** `value` is base64-decoded server-side — Electron's main↔renderer IPC
 * never crosses a real trust boundary (the user already owns the machine
 * and the cluster credentials), so there's nothing gained by keeping it
 * encoded. The UI still masks values behind a reveal toggle to avoid
 * shoulder-surfing/screenshots. */
export interface SecretDetail extends SecretSummary {
  createdAt: string | null
  labels: Record<string, string>
  data: { key: string; value: string }[]
}

export type EventType = 'Normal' | 'Warning'

export interface EventSummary {
  uid: string
  namespace: string
  type: EventType
  reason: string
  message: string
  involvedObjectKind: string
  involvedObjectName: string
  count: number
  firstSeen: string | null
  lastSeen: string | null
}

/** Every resource kind KubePilot knows how to fetch a single raw object for
 * — backs the generic "Describe" action shared across every resource
 * drawer instead of each one growing its own describe endpoint. */
export type DescribableKind =
  | 'pod'
  | 'deployment'
  | 'statefulset'
  | 'daemonset'
  | 'replicaset'
  | 'job'
  | 'cronjob'
  | 'service'
  | 'configmap'
  | 'secret'

export interface DescribeParams {
  kind: DescribableKind
  namespace: string
  name: string
}

/** Every resource kind KubePilot can delete. Mirrors {@link DescribableKind}
 * (anything you can look up you can also delete) but kept as its own type
 * since the two lists could diverge later (e.g. read-only resources). */
export type DeletableKind = DescribableKind

export interface DeleteParams {
  kind: DeletableKind
  namespace: string
  name: string
}

export type ScalableKind = 'deployment' | 'statefulset' | 'replicaset'

export interface ScaleParams {
  kind: ScalableKind
  namespace: string
  name: string
  replicas: number
}

/** DaemonSets have no replica count to scale but do support the same
 * "rolling restart" mechanism as Deployments/StatefulSets. */
export type RestartableKind = 'deployment' | 'statefulset' | 'daemonset'

export interface RestartParams {
  kind: RestartableKind
  namespace: string
  name: string
}

export interface ExecStartParams {
  namespace: string
  podName: string
  containerName?: string
  /** Defaults to `['/bin/sh']` when omitted — most container images ship a
   * POSIX shell even when they lack bash. */
  command?: string[]
}
