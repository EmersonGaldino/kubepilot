import type { V1Node } from '@kubernetes/client-node'

import type { NodeDetail, NodeSummary } from '../../../shared/types'
import { formatAge, podPhase } from '../../utils/k8s-format'
import type { ClusterService } from '../clusters/ClusterService'

function nodeRoles(node: V1Node): string {
  const labels = node.metadata?.labels ?? {}
  const roles = Object.keys(labels)
    .filter((key) => key.startsWith('node-role.kubernetes.io/'))
    .map((key) => key.replace('node-role.kubernetes.io/', '') || 'master')
  return roles.length > 0 ? roles.join(',') : '<none>'
}

function isReady(node: V1Node): boolean {
  return node.status?.conditions?.some((c) => c.type === 'Ready' && c.status === 'True') ?? false
}

function toSummary(node: V1Node): NodeSummary {
  return {
    name: node.metadata?.name ?? 'unknown',
    ready: isReady(node),
    roles: nodeRoles(node),
    kubeletVersion: node.status?.nodeInfo?.kubeletVersion ?? null,
    cpuAllocatable: node.status?.allocatable?.cpu ?? null,
    memoryAllocatable: node.status?.allocatable?.memory ?? null,
    unschedulable: Boolean(node.spec?.unschedulable),
    age: formatAge(node.metadata?.creationTimestamp),
  }
}

export class NodeService {
  constructor(private readonly clusterService: ClusterService) {}

  async list(): Promise<NodeSummary[]> {
    const { coreV1Api } = this.clusterService.getActiveBundle()
    const { items } = await coreV1Api.listNode()
    return items.map(toSummary).sort((a, b) => a.name.localeCompare(b.name))
  }

  async get(name: string): Promise<NodeDetail> {
    const { coreV1Api } = this.clusterService.getActiveBundle()
    const node = await coreV1Api.readNode({ name })
    const { items: pods } = await coreV1Api.listPodForAllNamespaces({ fieldSelector: `spec.nodeName=${name}` })

    return {
      ...toSummary(node),
      createdAt: node.metadata?.creationTimestamp ? new Date(node.metadata.creationTimestamp).toISOString() : null,
      labels: node.metadata?.labels ?? {},
      taints: (node.spec?.taints ?? []).map((t) => `${t.key}${t.value ? '=' + t.value : ''}:${t.effect}`),
      addresses: (node.status?.addresses ?? []).map((a) => ({ type: a.type ?? 'Unknown', address: a.address ?? '' })),
      conditions: (node.status?.conditions ?? []).map((c) => ({
        type: c.type ?? 'Unknown',
        status: c.status ?? 'Unknown',
        message: c.message ?? null,
      })),
      pods: pods.map((pod) => ({
        name: pod.metadata?.name ?? 'unknown',
        namespace: pod.metadata?.namespace ?? 'unknown',
        phase: podPhase(pod),
      })),
    }
  }

  async cordon(name: string, unschedulable: boolean): Promise<void> {
    const { coreV1Api } = this.clusterService.getActiveBundle()
    const node = await coreV1Api.readNode({ name })
    node.spec = node.spec ?? {}
    node.spec.unschedulable = unschedulable
    await coreV1Api.replaceNode({ name, body: node })
  }
}
