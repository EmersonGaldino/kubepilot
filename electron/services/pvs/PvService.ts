import type { V1PersistentVolume } from '@kubernetes/client-node'

import type { PvDetail, PvSummary } from '../../../shared/types'
import { formatAge } from '../../utils/k8s-format'
import type { ClusterService } from '../clusters/ClusterService'

function toSummary(pv: V1PersistentVolume): PvSummary {
  const claim = pv.spec?.claimRef
  return {
    name: pv.metadata?.name ?? 'unknown',
    status: pv.status?.phase ?? 'Unknown',
    capacity: pv.spec?.capacity?.storage ?? null,
    accessModes: (pv.spec?.accessModes ?? []).join(', '),
    reclaimPolicy: pv.spec?.persistentVolumeReclaimPolicy ?? null,
    storageClass: pv.spec?.storageClassName ?? null,
    claimRef: claim?.namespace && claim.name ? `${claim.namespace}/${claim.name}` : null,
    age: formatAge(pv.metadata?.creationTimestamp),
  }
}

export class PvService {
  constructor(private readonly clusterService: ClusterService) {}

  async list(): Promise<PvSummary[]> {
    const { coreV1Api } = this.clusterService.getActiveBundle()
    const { items } = await coreV1Api.listPersistentVolume()
    return items.map(toSummary).sort((a, b) => a.name.localeCompare(b.name))
  }

  async get(name: string): Promise<PvDetail> {
    const { coreV1Api } = this.clusterService.getActiveBundle()
    const pv = await coreV1Api.readPersistentVolume({ name })
    return {
      ...toSummary(pv),
      createdAt: pv.metadata?.creationTimestamp ? new Date(pv.metadata.creationTimestamp).toISOString() : null,
      labels: pv.metadata?.labels ?? {},
    }
  }
}
