import type { V1ReplicaSet } from '@kubernetes/client-node'

import type { ReplicaSetDetail, ReplicaSetSummary } from '../../../shared/types'
import type { ClusterService } from '../clusters/ClusterService'
import { classifyWorkloadStatus, formatAge } from '../../utils/k8s-format'

function toSummary(replicaSet: V1ReplicaSet): ReplicaSetSummary {
  const desired = replicaSet.spec?.replicas ?? 0
  const available = replicaSet.status?.availableReplicas ?? 0

  return {
    name: replicaSet.metadata?.name ?? 'unknown',
    namespace: replicaSet.metadata?.namespace ?? 'unknown',
    status: classifyWorkloadStatus(desired, available, available),
    ready: `${replicaSet.status?.readyReplicas ?? 0}/${desired}`,
    desiredReplicas: desired,
    availableReplicas: available,
    age: formatAge(replicaSet.metadata?.creationTimestamp),
  }
}

export interface ReplicaSetListParams {
  namespace: string | 'all'
}

export interface ReplicaSetGetParams {
  namespace: string
  name: string
}

/** Reads ReplicaSets (apps/v1) for whichever context {@link ClusterService}
 * currently considers active. Mirrors {@link DeploymentService}'s shape;
 * ReplicaSets have no separate "updated" replica concept so
 * {@link classifyWorkloadStatus} reuses `available` for both arguments. */
export class ReplicaSetService {
  constructor(private readonly clusterService: ClusterService) {}

  async list({ namespace }: ReplicaSetListParams): Promise<ReplicaSetSummary[]> {
    const { appsV1Api } = this.clusterService.getActiveBundle()

    const { items } =
      namespace === 'all'
        ? await appsV1Api.listReplicaSetForAllNamespaces()
        : await appsV1Api.listNamespacedReplicaSet({ namespace })

    return items.map(toSummary).sort((a, b) => a.name.localeCompare(b.name))
  }

  async get({ namespace, name }: ReplicaSetGetParams): Promise<ReplicaSetDetail> {
    const { appsV1Api } = this.clusterService.getActiveBundle()
    const replicaSet = await appsV1Api.readNamespacedReplicaSet({ name, namespace })
    const owner = replicaSet.metadata?.ownerReferences?.[0]

    return {
      ...toSummary(replicaSet),
      createdAt: replicaSet.metadata?.creationTimestamp
        ? new Date(replicaSet.metadata.creationTimestamp).toISOString()
        : null,
      labels: replicaSet.metadata?.labels ?? {},
      selector: replicaSet.spec?.selector?.matchLabels ?? {},
      containers: (replicaSet.spec?.template?.spec?.containers ?? []).map((c) => ({
        name: c.name,
        image: c.image ?? 'unknown',
      })),
      ownerKind: owner?.kind ?? null,
      ownerName: owner?.name ?? null,
    }
  }
}
