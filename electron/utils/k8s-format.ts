import type { V1DaemonSet, V1Deployment, V1Pod, V1StatefulSet } from '@kubernetes/client-node'
import type { ClusterProvider, PodPhase, WorkloadStatus } from '../../shared/types'

/**
 * Best-effort provider classification from context/cluster naming
 * conventions. Purely cosmetic — never used to branch API behavior, since
 * AKS/GKE/EKS/local clusters are all just Kubernetes API servers to KubePilot.
 */
export function classifyProvider(contextName: string, clusterName: string): ClusterProvider {
  const haystack = `${contextName} ${clusterName}`.toLowerCase()

  if (/\baks\b|azurehdinsight|azmk8s/.test(haystack)) return 'aks'
  if (/\bgke\b|gke_|container\.googleapis/.test(haystack)) return 'gke'
  if (/\beks\b|amazonaws|eks\./.test(haystack)) return 'eks'
  if (/minikube|rancher-desktop|docker-desktop|kind-|k3d-|k3s|colima/.test(haystack)) return 'local'

  return 'unknown'
}

export function formatAge(timestamp?: Date | string | null): string | null {
  if (!timestamp) return null

  const created = timestamp instanceof Date ? timestamp : new Date(timestamp)
  const diffMs = Date.now() - created.getTime()
  if (Number.isNaN(diffMs) || diffMs < 0) return null

  const seconds = Math.floor(diffMs / 1000)
  if (seconds < 60) return `${seconds}s`

  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m`

  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h`

  const days = Math.floor(hours / 24)
  if (days < 365) return `${days}d`

  const years = Math.floor(days / 365)
  return `${years}y`
}

export function podPhase(pod: V1Pod): PodPhase {
  const phase = pod.status?.phase
  if (phase === 'Running' || phase === 'Pending' || phase === 'Succeeded' || phase === 'Failed') {
    return phase
  }
  return 'Unknown'
}

export function podReadyRatio(pod: V1Pod): string {
  const statuses = pod.status?.containerStatuses ?? []
  if (statuses.length === 0) return '0/0'
  const ready = statuses.filter((c) => c.ready).length
  return `${ready}/${statuses.length}`
}

export function podRestartCount(pod: V1Pod): number {
  const statuses = pod.status?.containerStatuses ?? []
  return statuses.reduce((total, c) => total + (c.restartCount ?? 0), 0)
}

/** Deployments/StatefulSets/DaemonSets have no single "phase" field like Pods
 * do — this classifies one from desired/available/updated counts, mirroring
 * what `kubectl rollout status`/Lens show. Shared across every
 * controller-managed workload type so each service just extracts its own
 * status field names and delegates here. */
export function classifyWorkloadStatus(desired: number, available: number, updated: number): WorkloadStatus {
  if (desired === 0) return 'ScaledToZero'
  if (available >= desired && updated >= desired) return 'Available'
  if (available > 0) return 'Updating'
  return 'Unavailable'
}

export function deploymentReadyRatio(deployment: V1Deployment): string {
  const desired = deployment.spec?.replicas ?? 0
  const ready = deployment.status?.readyReplicas ?? 0
  return `${ready}/${desired}`
}

export function deploymentStatus(deployment: V1Deployment): WorkloadStatus {
  return classifyWorkloadStatus(
    deployment.spec?.replicas ?? 0,
    deployment.status?.availableReplicas ?? 0,
    deployment.status?.updatedReplicas ?? 0,
  )
}

export function statefulSetReadyRatio(statefulSet: V1StatefulSet): string {
  const desired = statefulSet.spec?.replicas ?? 0
  const ready = statefulSet.status?.readyReplicas ?? 0
  return `${ready}/${desired}`
}

export function statefulSetStatus(statefulSet: V1StatefulSet): WorkloadStatus {
  return classifyWorkloadStatus(
    statefulSet.spec?.replicas ?? 0,
    statefulSet.status?.availableReplicas ?? 0,
    statefulSet.status?.updatedReplicas ?? 0,
  )
}

/** DaemonSets have no user-set replica count — "desired" is however many
 * nodes match the pod template's node selector/tolerations, computed by the
 * controller as `desiredNumberScheduled`. */
export function daemonSetReadyRatio(daemonSet: V1DaemonSet): string {
  const desired = daemonSet.status?.desiredNumberScheduled ?? 0
  const ready = daemonSet.status?.numberReady ?? 0
  return `${ready}/${desired}`
}

export function daemonSetStatus(daemonSet: V1DaemonSet): WorkloadStatus {
  return classifyWorkloadStatus(
    daemonSet.status?.desiredNumberScheduled ?? 0,
    daemonSet.status?.numberAvailable ?? 0,
    daemonSet.status?.updatedNumberScheduled ?? 0,
  )
}

export function containerState(status?: { state?: { running?: unknown; waiting?: { reason?: string }; terminated?: { reason?: string } } }): string {
  if (!status?.state) return 'unknown'
  if (status.state.running) return 'running'
  if (status.state.waiting) return `waiting${status.state.waiting.reason ? ` (${status.state.waiting.reason})` : ''}`
  if (status.state.terminated) return `terminated${status.state.terminated.reason ? ` (${status.state.terminated.reason})` : ''}`
  return 'unknown'
}
