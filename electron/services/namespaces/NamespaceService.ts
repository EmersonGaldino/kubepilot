import type { NamespaceSummary } from '../../../shared/types'
import type { ClusterService } from '../clusters/ClusterService'
import { formatAge } from '../../utils/k8s-format'

/** Lists namespaces for whichever context {@link ClusterService} currently
 * considers active. */
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
      }))
      .sort((a, b) => a.name.localeCompare(b.name))
  }
}
