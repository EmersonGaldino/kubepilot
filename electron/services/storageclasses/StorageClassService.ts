import type { V1StorageClass } from '@kubernetes/client-node'

import type { StorageClassDetail, StorageClassSummary } from '../../../shared/types'
import { formatAge } from '../../utils/k8s-format'
import type { ClusterService } from '../clusters/ClusterService'

const DEFAULT_ANNOTATION = 'storageclass.kubernetes.io/is-default-class'

function toSummary(sc: V1StorageClass): StorageClassSummary {
  return {
    name: sc.metadata?.name ?? 'unknown',
    provisioner: sc.provisioner ?? '—',
    reclaimPolicy: sc.reclaimPolicy ?? null,
    volumeBindingMode: sc.volumeBindingMode ?? null,
    isDefault: sc.metadata?.annotations?.[DEFAULT_ANNOTATION] === 'true',
    age: formatAge(sc.metadata?.creationTimestamp),
  }
}

export class StorageClassService {
  constructor(private readonly clusterService: ClusterService) {}

  async list(): Promise<StorageClassSummary[]> {
    const { storageV1Api } = this.clusterService.getActiveBundle()
    const { items } = await storageV1Api.listStorageClass()
    return items.map(toSummary).sort((a, b) => a.name.localeCompare(b.name))
  }

  async get(name: string): Promise<StorageClassDetail> {
    const { storageV1Api } = this.clusterService.getActiveBundle()
    const sc = await storageV1Api.readStorageClass({ name })
    return {
      ...toSummary(sc),
      createdAt: sc.metadata?.creationTimestamp ? new Date(sc.metadata.creationTimestamp).toISOString() : null,
      labels: sc.metadata?.labels ?? {},
      parameters: sc.parameters ?? {},
    }
  }
}
