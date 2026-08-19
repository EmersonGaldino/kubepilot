import type { V1Deployment } from '@kubernetes/client-node'

import type { DeploymentDetail, DeploymentSummary } from '../../../shared/types'
import type { ClusterService } from '../clusters/ClusterService'
import { deploymentReadyRatio, deploymentStatus, formatAge } from '../../utils/k8s-format'

function toSummary(deployment: V1Deployment): DeploymentSummary {
  return {
    name: deployment.metadata?.name ?? 'unknown',
    namespace: deployment.metadata?.namespace ?? 'unknown',
    status: deploymentStatus(deployment),
    ready: deploymentReadyRatio(deployment),
    desiredReplicas: deployment.spec?.replicas ?? 0,
    updatedReplicas: deployment.status?.updatedReplicas ?? 0,
    availableReplicas: deployment.status?.availableReplicas ?? 0,
    age: formatAge(deployment.metadata?.creationTimestamp),
  }
}

export interface DeploymentListParams {
  namespace: string | 'all'
}

export interface DeploymentGetParams {
  namespace: string
  name: string
}

/** Reads Deployments (apps/v1) for whichever context {@link ClusterService}
 * currently considers active. Mirrors {@link PodService}'s shape. */
export class DeploymentService {
  constructor(private readonly clusterService: ClusterService) {}

  async list({ namespace }: DeploymentListParams): Promise<DeploymentSummary[]> {
    const { appsV1Api } = this.clusterService.getActiveBundle()

    const { items } =
      namespace === 'all'
        ? await appsV1Api.listDeploymentForAllNamespaces()
        : await appsV1Api.listNamespacedDeployment({ namespace })

    return items.map(toSummary).sort((a, b) => a.name.localeCompare(b.name))
  }

  async get({ namespace, name }: DeploymentGetParams): Promise<DeploymentDetail> {
    const { appsV1Api } = this.clusterService.getActiveBundle()
    const deployment = await appsV1Api.readNamespacedDeployment({ name, namespace })

    return {
      ...toSummary(deployment),
      createdAt: deployment.metadata?.creationTimestamp
        ? new Date(deployment.metadata.creationTimestamp).toISOString()
        : null,
      labels: deployment.metadata?.labels ?? {},
      selector: deployment.spec?.selector?.matchLabels ?? {},
      strategy: deployment.spec?.strategy?.type ?? 'Unknown',
      containers: (deployment.spec?.template.spec?.containers ?? []).map((c) => ({
        name: c.name,
        image: c.image ?? 'unknown',
      })),
      conditions: (deployment.status?.conditions ?? []).map((c) => ({
        type: c.type,
        status: c.status,
        message: c.message ?? null,
      })),
    }
  }
}
