import * as yaml from 'js-yaml'
import { KubernetesObjectApi, PatchStrategy, type KubernetesObject } from '@kubernetes/client-node'

import type { ApplyParams, ApplyResult } from '../../../shared/types'
import type { ClusterService } from '../clusters/ClusterService'

function isNotFound(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error)
  return message.includes('404') || message.toLowerCase().includes('not found')
}

function prepareSpec(raw: unknown): KubernetesObject {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    throw new Error('YAML must describe a single Kubernetes object')
  }
  const spec = raw as KubernetesObject & { status?: unknown }
  if (!spec.kind || !spec.apiVersion) {
    throw new Error('YAML is missing kind or apiVersion')
  }
  spec.metadata = spec.metadata ?? {}
  if (!spec.metadata.name) {
    throw new Error('YAML is missing metadata.name')
  }
  delete spec.status
  if (spec.metadata) {
    delete spec.metadata.managedFields
    delete spec.metadata.resourceVersion
    delete spec.metadata.uid
    delete spec.metadata.generation
    delete spec.metadata.creationTimestamp
  }
  return spec
}

export class ApplyService {
  constructor(private readonly clusterService: ClusterService) {}

  async apply({ yaml: text, dryRun }: ApplyParams): Promise<ApplyResult> {
    const parsed = yaml.load(text)
    const spec = prepareSpec(parsed)
    const { kubeConfig } = this.clusterService.getActiveBundle()
    const client = KubernetesObjectApi.makeApiClient(kubeConfig)
    const dry = dryRun ? 'All' : undefined

    const header = {
      apiVersion: spec.apiVersion,
      kind: spec.kind,
      metadata: { name: spec.metadata?.name ?? '', namespace: spec.metadata?.namespace },
    }

    let created = false
    try {
      await client.read(header)
      await client.patch(spec, undefined, dry, 'kubepilot', true, PatchStrategy.ServerSideApply)
    } catch (error) {
      if (!isNotFound(error)) throw error
      created = true
      await client.create(spec, undefined, dry, 'kubepilot')
    }

    return {
      kind: spec.kind ?? 'Unknown',
      name: spec.metadata?.name ?? 'unknown',
      namespace: spec.metadata?.namespace ?? null,
      created,
      dryRun: Boolean(dryRun),
    }
  }
}
