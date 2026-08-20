import type { V1PersistentVolumeClaim } from '@kubernetes/client-node'

import type { PvcDetail, PvcSummary } from '../../../shared/types'
import { formatAge } from '../../utils/k8s-format'
import type { ClusterService } from '../clusters/ClusterService'

function toSummary(pvc: V1PersistentVolumeClaim): PvcSummary {
  return {
    name: pvc.metadata?.name ?? 'unknown',
    namespace: pvc.metadata?.namespace ?? 'unknown',
    phase: pvc.status?.phase ?? 'Unknown',
    volumeName: pvc.spec?.volumeName ?? null,
    capacity: pvc.status?.capacity?.storage ?? pvc.spec?.resources?.requests?.storage ?? null,
    accessModes: (pvc.spec?.accessModes ?? []).join(', '),
    storageClass: pvc.spec?.storageClassName ?? null,
    age: formatAge(pvc.metadata?.creationTimestamp),
  }
}

export class PvcService {
  constructor(private readonly clusterService: ClusterService) {}

  async list(namespace: string | 'all'): Promise<PvcSummary[]> {
    const { coreV1Api } = this.clusterService.getActiveBundle()
    const { items } =
      namespace === 'all'
        ? await coreV1Api.listPersistentVolumeClaimForAllNamespaces()
        : await coreV1Api.listNamespacedPersistentVolumeClaim({ namespace })
    return items.map(toSummary).sort((a, b) => a.name.localeCompare(b.name))
  }

  async get(namespace: string, name: string): Promise<PvcDetail> {
    const { coreV1Api } = this.clusterService.getActiveBundle()
    const pvc = await coreV1Api.readNamespacedPersistentVolumeClaim({ name, namespace })
    return {
      ...toSummary(pvc),
      createdAt: pvc.metadata?.creationTimestamp ? new Date(pvc.metadata.creationTimestamp).toISOString() : null,
      labels: pvc.metadata?.labels ?? {},
    }
  }
}
