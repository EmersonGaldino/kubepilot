import type { V1DaemonSet } from '@kubernetes/client-node'

import type { DaemonSetDetail, DaemonSetSummary } from '../../../shared/types'
import type { ClusterService } from '../clusters/ClusterService'
import { daemonSetReadyRatio, daemonSetStatus, formatAge } from '../../utils/k8s-format'

function toSummary(daemonSet: V1DaemonSet): DaemonSetSummary {
  return {
    name: daemonSet.metadata?.name ?? 'unknown',
    namespace: daemonSet.metadata?.namespace ?? 'unknown',
    status: daemonSetStatus(daemonSet),
    ready: daemonSetReadyRatio(daemonSet),
    desiredScheduled: daemonSet.status?.desiredNumberScheduled ?? 0,
    updatedScheduled: daemonSet.status?.updatedNumberScheduled ?? 0,
    availableScheduled: daemonSet.status?.numberAvailable ?? 0,
    age: formatAge(daemonSet.metadata?.creationTimestamp),
  }
}

export interface DaemonSetListParams {
  namespace: string | 'all'
}

export interface DaemonSetGetParams {
  namespace: string
  name: string
}

/** Reads DaemonSets (apps/v1) for whichever context {@link ClusterService}
 * currently considers active. Mirrors {@link DeploymentService}'s shape. */
export class DaemonSetService {
  constructor(private readonly clusterService: ClusterService) {}

  async list({ namespace }: DaemonSetListParams): Promise<DaemonSetSummary[]> {
    const { appsV1Api } = this.clusterService.getActiveBundle()

    const { items } =
      namespace === 'all'
        ? await appsV1Api.listDaemonSetForAllNamespaces()
        : await appsV1Api.listNamespacedDaemonSet({ namespace })

    return items.map(toSummary).sort((a, b) => a.name.localeCompare(b.name))
  }

  async get({ namespace, name }: DaemonSetGetParams): Promise<DaemonSetDetail> {
    const { appsV1Api } = this.clusterService.getActiveBundle()
    const daemonSet = await appsV1Api.readNamespacedDaemonSet({ name, namespace })

    return {
      ...toSummary(daemonSet),
      createdAt: daemonSet.metadata?.creationTimestamp
        ? new Date(daemonSet.metadata.creationTimestamp).toISOString()
        : null,
      labels: daemonSet.metadata?.labels ?? {},
      selector: daemonSet.spec?.selector?.matchLabels ?? {},
      containers: (daemonSet.spec?.template.spec?.containers ?? []).map((c) => ({
        name: c.name,
        image: c.image ?? 'unknown',
      })),
      conditions: (daemonSet.status?.conditions ?? []).map((c) => ({
        type: c.type,
        status: c.status,
        message: c.message ?? null,
      })),
    }
  }
}
