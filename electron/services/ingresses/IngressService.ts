import type { V1Ingress } from '@kubernetes/client-node'

import type { IngressDetail, IngressSummary } from '../../../shared/types'
import { formatAge } from '../../utils/k8s-format'
import type { ClusterService } from '../clusters/ClusterService'

function hostsOf(ingress: V1Ingress): string {
  return (ingress.spec?.rules ?? []).map((r) => r.host ?? '*').join(', ')
}

function addressOf(ingress: V1Ingress): string | null {
  const first = ingress.status?.loadBalancer?.ingress?.[0]
  return first?.ip ?? first?.hostname ?? null
}

function portsOf(ingress: V1Ingress): string {
  const tls = (ingress.spec?.tls?.length ?? 0) > 0
  return tls ? '80, 443' : '80'
}

function toSummary(ingress: V1Ingress): IngressSummary {
  return {
    name: ingress.metadata?.name ?? 'unknown',
    namespace: ingress.metadata?.namespace ?? 'unknown',
    className: ingress.spec?.ingressClassName ?? ingress.metadata?.annotations?.['kubernetes.io/ingress.class'] ?? null,
    hosts: hostsOf(ingress),
    address: addressOf(ingress),
    ports: portsOf(ingress),
    age: formatAge(ingress.metadata?.creationTimestamp),
  }
}

export class IngressService {
  constructor(private readonly clusterService: ClusterService) {}

  async list(namespace: string | 'all'): Promise<IngressSummary[]> {
    const { networkingV1Api } = this.clusterService.getActiveBundle()
    const { items } =
      namespace === 'all'
        ? await networkingV1Api.listIngressForAllNamespaces()
        : await networkingV1Api.listNamespacedIngress({ namespace })
    return items.map(toSummary).sort((a, b) => a.name.localeCompare(b.name))
  }

  async get(namespace: string, name: string): Promise<IngressDetail> {
    const { networkingV1Api } = this.clusterService.getActiveBundle()
    const ingress = await networkingV1Api.readNamespacedIngress({ name, namespace })
    const rules = (ingress.spec?.rules ?? []).flatMap((rule) => {
      const paths = rule.http?.paths ?? [{ path: '/', pathType: 'Prefix', backend: { service: undefined } }]
      return paths.map((path) => ({
        host: rule.host ?? '*',
        path: path.path ?? '/',
        serviceName: path.backend?.service?.name ?? null,
        servicePort: path.backend?.service?.port?.number != null
          ? String(path.backend.service.port.number)
          : path.backend?.service?.port?.name ?? null,
      }))
    })

    return {
      ...toSummary(ingress),
      createdAt: ingress.metadata?.creationTimestamp ? new Date(ingress.metadata.creationTimestamp).toISOString() : null,
      labels: ingress.metadata?.labels ?? {},
      tlsSecrets: (ingress.spec?.tls ?? []).flatMap((t) => (t.secretName ? [t.secretName] : [])),
      rules,
    }
  }
}
