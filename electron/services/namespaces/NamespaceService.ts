import type { NamespaceCreateParams, NamespaceDetail, NamespaceSummary } from '../../../shared/types'
import { formatAge } from '../../utils/k8s-format'
import type { ClusterService } from '../clusters/ClusterService'

export class NamespaceService {
  constructor(private readonly clusterService: ClusterService) {}

  async list(): Promise<NamespaceSummary[]> {
    const { coreV1Api } = this.clusterService.getActiveBundle()
    const { items } = await coreV1Api.listNamespace()

    return items
      .map((ns) => ({
        name: ns.metadata?.name ?? 'unknown',
        status: ns.status?.phase ?? 'Unknown',
        age: formatAge(ns.metadata?.creationTimestamp),
        labels: ns.metadata?.labels ?? {},
      }))
      .sort((a, b) => a.name.localeCompare(b.name))
  }

  async get(name: string): Promise<NamespaceDetail> {
    const { coreV1Api } = this.clusterService.getActiveBundle()
    const ns = await coreV1Api.readNamespace({ name })
    const [quotas, limits] = await Promise.all([
      coreV1Api.listNamespacedResourceQuota({ namespace: name }).catch(() => ({ items: [] })),
      coreV1Api.listNamespacedLimitRange({ namespace: name }).catch(() => ({ items: [] })),
    ])

    return {
      name: ns.metadata?.name ?? name,
      status: ns.status?.phase ?? 'Unknown',
      age: formatAge(ns.metadata?.creationTimestamp),
      labels: ns.metadata?.labels ?? {},
      createdAt: ns.metadata?.creationTimestamp ? new Date(ns.metadata.creationTimestamp).toISOString() : null,
      annotations: ns.metadata?.annotations ?? {},
      resourceQuotas: (quotas.items ?? []).map((q) => ({
        name: q.metadata?.name ?? 'unknown',
        hard: Object.entries(q.status?.hard ?? q.spec?.hard ?? {})
          .map(([k, v]) => `${k}=${v}`)
          .join(', '),
      })),
      limitRanges: (limits.items ?? []).map((lr) => ({
        name: lr.metadata?.name ?? 'unknown',
        summary: (lr.spec?.limits ?? [])
          .map((l) => l.type ?? 'Limit')
          .join(', '),
      })),
    }
  }

  async create({ name, labels }: NamespaceCreateParams): Promise<void> {
    const { coreV1Api } = this.clusterService.getActiveBundle()
    await coreV1Api.createNamespace({
      body: {
        apiVersion: 'v1',
        kind: 'Namespace',
        metadata: { name, labels: labels ?? {} },
      },
    })
  }

  async delete(name: string): Promise<void> {
    const { coreV1Api } = this.clusterService.getActiveBundle()
    await coreV1Api.deleteNamespace({ name })
  }
}
