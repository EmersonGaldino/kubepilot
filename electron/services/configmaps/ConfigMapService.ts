import type { V1ConfigMap } from '@kubernetes/client-node'

import type { ConfigMapDetail, ConfigMapSummary } from '../../../shared/types'
import type { ClusterService } from '../clusters/ClusterService'
import { formatAge } from '../../utils/k8s-format'

function toSummary(configMap: V1ConfigMap): ConfigMapSummary {
  return {
    name: configMap.metadata?.name ?? 'unknown',
    namespace: configMap.metadata?.namespace ?? 'unknown',
    keyCount: Object.keys(configMap.data ?? {}).length,
    age: formatAge(configMap.metadata?.creationTimestamp),
  }
}

export interface ConfigMapListParams {
  namespace: string | 'all'
}

export interface ConfigMapGetParams {
  namespace: string
  name: string
}

/** Reads ConfigMaps (core/v1) for whichever context {@link ClusterService}
 * currently considers active. Mirrors {@link DeploymentService}'s shape. */
export class ConfigMapService {
  constructor(private readonly clusterService: ClusterService) {}

  async list({ namespace }: ConfigMapListParams): Promise<ConfigMapSummary[]> {
    const { coreV1Api } = this.clusterService.getActiveBundle()

    const { items } =
      namespace === 'all'
        ? await coreV1Api.listConfigMapForAllNamespaces()
        : await coreV1Api.listNamespacedConfigMap({ namespace })

    return items.map(toSummary).sort((a, b) => a.name.localeCompare(b.name))
  }

  async get({ namespace, name }: ConfigMapGetParams): Promise<ConfigMapDetail> {
    const { coreV1Api } = this.clusterService.getActiveBundle()
    const configMap = await coreV1Api.readNamespacedConfigMap({ name, namespace })

    return {
      ...toSummary(configMap),
      createdAt: configMap.metadata?.creationTimestamp
        ? new Date(configMap.metadata.creationTimestamp).toISOString()
        : null,
      labels: configMap.metadata?.labels ?? {},
      data: Object.entries(configMap.data ?? {})
        .map(([key, value]) => ({ key, value }))
        .sort((a, b) => a.key.localeCompare(b.key)),
    }
  }
}
