import type { V1Secret } from '@kubernetes/client-node'

import type { SecretDetail, SecretSummary } from '../../../shared/types'
import type { ClusterService } from '../clusters/ClusterService'
import { formatAge } from '../../utils/k8s-format'

function toSummary(secret: V1Secret): SecretSummary {
  return {
    name: secret.metadata?.name ?? 'unknown',
    namespace: secret.metadata?.namespace ?? 'unknown',
    type: secret.type ?? 'Opaque',
    keyCount: Object.keys(secret.data ?? {}).length,
    age: formatAge(secret.metadata?.creationTimestamp),
  }
}

export interface SecretListParams {
  namespace: string | 'all'
}

export interface SecretGetParams {
  namespace: string
  name: string
}

/** Reads Secrets (core/v1) for whichever context {@link ClusterService}
 * currently considers active. Mirrors {@link DeploymentService}'s shape. */
export class SecretService {
  constructor(private readonly clusterService: ClusterService) {}

  async list({ namespace }: SecretListParams): Promise<SecretSummary[]> {
    const { coreV1Api } = this.clusterService.getActiveBundle()

    const { items } =
      namespace === 'all'
        ? await coreV1Api.listSecretForAllNamespaces()
        : await coreV1Api.listNamespacedSecret({ namespace })

    return items.map(toSummary).sort((a, b) => a.name.localeCompare(b.name))
  }

  async get({ namespace, name }: SecretGetParams): Promise<SecretDetail> {
    const { coreV1Api } = this.clusterService.getActiveBundle()
    const secret = await coreV1Api.readNamespacedSecret({ name, namespace })

    return {
      ...toSummary(secret),
      createdAt: secret.metadata?.creationTimestamp
        ? new Date(secret.metadata.creationTimestamp).toISOString()
        : null,
      labels: secret.metadata?.labels ?? {},
      // Best-effort base64 decode for display — genuinely binary secret
      // values (e.g. TLS private keys) may render as mojibake, that's an
      // accepted simplification for a desktop inspection tool.
      data: Object.entries(secret.data ?? {})
        .map(([key, raw]) => ({ key, value: Buffer.from(raw, 'base64').toString('utf8') }))
        .sort((a, b) => a.key.localeCompare(b.key)),
    }
  }
}
