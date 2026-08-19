import { watch, type FSWatcher } from 'node:fs'
import { homedir } from 'node:os'
import { delimiter, join } from 'node:path'

import { KubeConfig } from '@kubernetes/client-node'

import type { KubeContext } from '../../../shared/types'
import { classifyProvider } from '../../utils/k8s-format'

export interface KubeconfigSnapshot {
  contexts: KubeContext[]
  currentContext: string | null
}

/**
 * Reads the kubeconfig KubePilot's host machine already trusts — the same
 * file(s) `kubectl` uses — and watches it for out-of-band changes (e.g. the
 * user running `kubectl config use-context` in a terminal).
 *
 * This service never writes to the kubeconfig file. Switching clusters
 * inside KubePilot only changes an in-memory "active context" (see
 * ClusterService); it never mutates the user's `current-context` on disk.
 */
export class KubeconfigService {
  /** Resolves the same way `KubeConfig.loadFromDefault` does: $KUBECONFIG
   * (first entry) or ~/.kube/config. Used only to know which file to watch. */
  static resolvePrimaryPath(): string {
    const fromEnv = process.env.KUBECONFIG?.split(delimiter).filter(Boolean)[0]
    return fromEnv ?? join(homedir(), '.kube', 'config')
  }

  private watcher: FSWatcher | null = null
  private debounceTimer: ReturnType<typeof setTimeout> | null = null

  /** Loads a fresh KubeConfig straight from disk. Cheap (YAML parse only) —
   * safe to call on every read so we never serve stale credentials. */
  loadFromDefault(): KubeConfig {
    const kubeConfig = new KubeConfig()
    kubeConfig.loadFromDefault()
    return kubeConfig
  }

  getSnapshot(): KubeconfigSnapshot {
    const kubeConfig = this.loadFromDefault()
    const currentContext = kubeConfig.getCurrentContext() || null

    const contexts: KubeContext[] = kubeConfig.getContexts().map((ctx) => {
      const cluster = kubeConfig.getCluster(ctx.cluster)
      return {
        name: ctx.name,
        clusterName: ctx.cluster,
        userName: ctx.user,
        namespace: ctx.namespace ?? null,
        isCurrent: ctx.name === currentContext,
        provider: classifyProvider(ctx.name, cluster?.server ?? ctx.cluster),
      }
    })

    return { contexts, currentContext }
  }

  /** Watches the primary kubeconfig file for edits (e.g. `kubectl config
   * use-context`) and invokes `onChange` with a debounced, fresh snapshot. */
  watch(onChange: (snapshot: KubeconfigSnapshot) => void): () => void {
    const path = KubeconfigService.resolvePrimaryPath()

    try {
      this.watcher = watch(path, { persistent: false }, () => {
        if (this.debounceTimer) clearTimeout(this.debounceTimer)
        this.debounceTimer = setTimeout(() => {
          onChange(this.getSnapshot())
        }, 200)
      })
    } catch (error) {
      console.error(`[KubeconfigService] failed to watch ${path}:`, error)
    }

    return () => this.stopWatching()
  }

  stopWatching(): void {
    if (this.debounceTimer) clearTimeout(this.debounceTimer)
    this.watcher?.close()
    this.watcher = null
  }
}
