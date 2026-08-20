import type { V2HorizontalPodAutoscaler, V2MetricSpec, V2MetricStatus } from '@kubernetes/client-node'

import type { HpaDetail, HpaSummary } from '../../../shared/types'
import { formatAge } from '../../utils/k8s-format'
import type { ClusterService } from '../clusters/ClusterService'

function describeMetricSpec(metric: V2MetricSpec): string {
  if (metric.type === 'Resource' && metric.resource) {
    const target = metric.resource.target
    const value =
      target?.averageUtilization != null
        ? `${target.averageUtilization}%`
        : target?.averageValue ?? target?.value ?? '?'
    return `${metric.resource.name} ${target?.type ?? ''} ${value}`.trim()
  }
  if (metric.pods?.metric) return `pods/${metric.pods.metric.name}`
  if (metric.object?.metric) return `object/${metric.object.metric.name}`
  if (metric.external?.metric) return `external/${metric.external.metric.name}`
  if (metric.containerResource) return `container/${metric.containerResource.name}`
  return metric.type ?? 'unknown'
}

function describeMetricStatus(metric: V2MetricStatus): string | null {
  if (metric.resource) {
    const current = metric.resource.current
    if (current?.averageUtilization != null) return `${metric.resource.name} ${current.averageUtilization}%`
    if (current?.averageValue) return `${metric.resource.name} ${current.averageValue}`
    if (current?.value) return `${metric.resource.name} ${current.value}`
  }
  return null
}

function toSummary(hpa: V2HorizontalPodAutoscaler): HpaSummary {
  const specs = hpa.spec?.metrics ?? []
  const statuses = hpa.status?.currentMetrics ?? []
  const primary = specs[0] ? describeMetricSpec(specs[0]) : '—'
  const current = statuses[0] ? describeMetricStatus(statuses[0]) : null

  return {
    name: hpa.metadata?.name ?? 'unknown',
    namespace: hpa.metadata?.namespace ?? 'unknown',
    targetKind: hpa.spec?.scaleTargetRef?.kind ?? '—',
    targetName: hpa.spec?.scaleTargetRef?.name ?? '—',
    minReplicas: hpa.spec?.minReplicas ?? 1,
    maxReplicas: hpa.spec?.maxReplicas ?? 0,
    currentReplicas: hpa.status?.currentReplicas ?? null,
    desiredReplicas: hpa.status?.desiredReplicas ?? null,
    primaryMetric: primary,
    currentMetric: current,
    age: formatAge(hpa.metadata?.creationTimestamp),
  }
}

export class HpaService {
  constructor(private readonly clusterService: ClusterService) {}

  async list(namespace: string | 'all'): Promise<HpaSummary[]> {
    const { autoscalingV2Api } = this.clusterService.getActiveBundle()
    const { items } =
      namespace === 'all'
        ? await autoscalingV2Api.listHorizontalPodAutoscalerForAllNamespaces()
        : await autoscalingV2Api.listNamespacedHorizontalPodAutoscaler({ namespace })
    return items.map(toSummary).sort((a, b) => a.name.localeCompare(b.name))
  }

  async get(namespace: string, name: string): Promise<HpaDetail> {
    const { autoscalingV2Api } = this.clusterService.getActiveBundle()
    const hpa = await autoscalingV2Api.readNamespacedHorizontalPodAutoscaler({ name, namespace })
    return {
      ...toSummary(hpa),
      createdAt: hpa.metadata?.creationTimestamp ? new Date(hpa.metadata.creationTimestamp).toISOString() : null,
      labels: hpa.metadata?.labels ?? {},
      conditions: (hpa.status?.conditions ?? []).map((c) => ({
        type: c.type ?? 'Unknown',
        status: c.status ?? 'Unknown',
        message: c.message ?? null,
      })),
      metrics: (hpa.spec?.metrics ?? []).map(describeMetricSpec),
    }
  }
}
