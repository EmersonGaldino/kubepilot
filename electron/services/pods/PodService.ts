import type { V1Pod } from '@kubernetes/client-node'

import type { PodDetail, PodSummary } from '../../../shared/types'
import type { ClusterService } from '../clusters/ClusterService'
import { containerState, formatAge, podPhase, podReadyRatio, podRestartCount } from '../../utils/k8s-format'

function toSummary(pod: V1Pod): PodSummary {
  return {
    name: pod.metadata?.name ?? 'unknown',
    namespace: pod.metadata?.namespace ?? 'unknown',
    phase: podPhase(pod),
    ready: podReadyRatio(pod),
    restarts: podRestartCount(pod),
    age: formatAge(pod.metadata?.creationTimestamp),
    node: pod.spec?.nodeName ?? null,
    podIP: pod.status?.podIP ?? null,
  }
}

export interface PodListParams {
  namespace: string | 'all'
  labelSelector?: string
}

export interface PodGetParams {
  namespace: string
  name: string
}

/** Reads pods for whichever context {@link ClusterService} currently
 * considers active. */
export class PodService {
  constructor(private readonly clusterService: ClusterService) {}

  async list({ namespace, labelSelector }: PodListParams): Promise<PodSummary[]> {
    const { coreV1Api } = this.clusterService.getActiveBundle()

    const { items } =
      namespace === 'all'
        ? await coreV1Api.listPodForAllNamespaces({ labelSelector })
        : await coreV1Api.listNamespacedPod({ namespace, labelSelector })

    return items.map(toSummary).sort((a, b) => a.name.localeCompare(b.name))
  }

  async get({ namespace, name }: PodGetParams): Promise<PodDetail> {
    const { coreV1Api } = this.clusterService.getActiveBundle()
    const pod = await coreV1Api.readNamespacedPod({ name, namespace })

    const statusByName = new Map((pod.status?.containerStatuses ?? []).map((s) => [s.name, s]))
    const owner = pod.metadata?.ownerReferences?.[0]

    return {
      ...toSummary(pod),
      createdAt: pod.metadata?.creationTimestamp ? new Date(pod.metadata.creationTimestamp).toISOString() : null,
      labels: pod.metadata?.labels ?? {},
      ownerKind: owner?.kind ?? null,
      ownerName: owner?.name ?? null,
      containers: (pod.spec?.containers ?? []).map((c) => {
        const status = statusByName.get(c.name)
        return {
          name: c.name,
          image: c.image ?? 'unknown',
          ready: status?.ready ?? false,
          restartCount: status?.restartCount ?? 0,
          state: containerState(status),
        }
      }),
    }
  }
}
