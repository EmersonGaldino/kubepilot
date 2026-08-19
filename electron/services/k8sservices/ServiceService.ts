import type { V1Service } from '@kubernetes/client-node'

import type { ServiceDetail, ServiceSummary } from '../../../shared/types'
import type { ClusterService } from '../clusters/ClusterService'
import { formatAge } from '../../utils/k8s-format'

function toPortsSummary(service: V1Service): string {
  return (service.spec?.ports ?? [])
    .map((p) => `${p.port}${p.nodePort ? ':' + p.nodePort : ''}/${p.protocol}`)
    .join(', ')
}

function toSummary(service: V1Service): ServiceSummary {
  return {
    name: service.metadata?.name ?? 'unknown',
    namespace: service.metadata?.namespace ?? 'unknown',
    type: service.spec?.type ?? 'ClusterIP',
    clusterIP: service.spec?.clusterIP ?? null,
    externalIP:
      service.status?.loadBalancer?.ingress?.[0]?.ip ??
      service.status?.loadBalancer?.ingress?.[0]?.hostname ??
      service.spec?.externalIPs?.[0] ??
      null,
    ports: toPortsSummary(service),
    age: formatAge(service.metadata?.creationTimestamp),
  }
}

export interface ServiceListParams {
  namespace: string | 'all'
}

export interface ServiceGetParams {
  namespace: string
  name: string
}

/** Reads Services (core/v1) for whichever context {@link ClusterService}
 * currently considers active. Mirrors {@link DeploymentService}'s shape;
 * Services have no scale/restart concept, only Describe/Delete. */
export class ServiceService {
  constructor(private readonly clusterService: ClusterService) {}

  async list({ namespace }: ServiceListParams): Promise<ServiceSummary[]> {
    const { coreV1Api } = this.clusterService.getActiveBundle()

    const { items } =
      namespace === 'all'
        ? await coreV1Api.listServiceForAllNamespaces()
        : await coreV1Api.listNamespacedService({ namespace })

    return items.map(toSummary).sort((a, b) => a.name.localeCompare(b.name))
  }

  async get({ namespace, name }: ServiceGetParams): Promise<ServiceDetail> {
    const { coreV1Api } = this.clusterService.getActiveBundle()
    const service = await coreV1Api.readNamespacedService({ name, namespace })

    return {
      ...toSummary(service),
      createdAt: service.metadata?.creationTimestamp
        ? new Date(service.metadata.creationTimestamp).toISOString()
        : null,
      labels: service.metadata?.labels ?? {},
      selector: service.spec?.selector ?? {},
      portList: (service.spec?.ports ?? []).map((p) => ({
        name: p.name ?? null,
        port: p.port,
        targetPort: p.targetPort != null ? String(p.targetPort) : null,
        protocol: p.protocol ?? 'TCP',
        nodePort: p.nodePort ?? null,
      })),
    }
  }
}
