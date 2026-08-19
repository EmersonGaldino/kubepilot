import type { V1StatefulSet } from '@kubernetes/client-node'

import type { StatefulSetDetail, StatefulSetSummary } from '../../../shared/types'
import type { ClusterService } from '../clusters/ClusterService'
import { formatAge, statefulSetReadyRatio, statefulSetStatus } from '../../utils/k8s-format'

function toSummary(statefulSet: V1StatefulSet): StatefulSetSummary {
  return {
    name: statefulSet.metadata?.name ?? 'unknown',
    namespace: statefulSet.metadata?.namespace ?? 'unknown',
    status: statefulSetStatus(statefulSet),
    ready: statefulSetReadyRatio(statefulSet),
    desiredReplicas: statefulSet.spec?.replicas ?? 0,
    updatedReplicas: statefulSet.status?.updatedReplicas ?? 0,
    availableReplicas: statefulSet.status?.availableReplicas ?? 0,
    age: formatAge(statefulSet.metadata?.creationTimestamp),
  }
}

export interface StatefulSetListParams {
  namespace: string | 'all'
}

export interface StatefulSetGetParams {
  namespace: string
  name: string
}

/** Reads StatefulSets (apps/v1) for whichever context {@link ClusterService}
 * currently considers active. Mirrors {@link DeploymentService}'s shape. */
export class StatefulSetService {
  constructor(private readonly clusterService: ClusterService) {}

  async list({ namespace }: StatefulSetListParams): Promise<StatefulSetSummary[]> {
    const { appsV1Api } = this.clusterService.getActiveBundle()

    const { items } =
      namespace === 'all'
        ? await appsV1Api.listStatefulSetForAllNamespaces()
        : await appsV1Api.listNamespacedStatefulSet({ namespace })

    return items.map(toSummary).sort((a, b) => a.name.localeCompare(b.name))
  }

  async get({ namespace, name }: StatefulSetGetParams): Promise<StatefulSetDetail> {
    const { appsV1Api } = this.clusterService.getActiveBundle()
    const statefulSet = await appsV1Api.readNamespacedStatefulSet({ name, namespace })

    return {
      ...toSummary(statefulSet),
      createdAt: statefulSet.metadata?.creationTimestamp
        ? new Date(statefulSet.metadata.creationTimestamp).toISOString()
        : null,
      labels: statefulSet.metadata?.labels ?? {},
      selector: statefulSet.spec?.selector?.matchLabels ?? {},
      serviceName: statefulSet.spec?.serviceName ?? null,
      containers: (statefulSet.spec?.template.spec?.containers ?? []).map((c) => ({
        name: c.name,
        image: c.image ?? 'unknown',
      })),
      conditions: (statefulSet.status?.conditions ?? []).map((c) => ({
        type: c.type,
        status: c.status,
        message: c.message ?? null,
      })),
    }
  }
}
