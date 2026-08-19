import { EventEmitter } from 'node:events'

import type { ClusterInfo, ConnectionStatus, KubeContext } from '../../../shared/types'
import type { KubeconfigService } from '../kubeconfig/KubeconfigService'
import type { KubernetesClientBundle, KubernetesClientFactory } from '../kubernetes/KubernetesClientFactory'
import { classifyProvider } from '../../utils/k8s-format'

export interface ClusterContextsSnapshot {
  contexts: KubeContext[]
  currentContext: string | null
}

const CONNECTION_TIMEOUT_MS = 5_000

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms)
    }),
  ])
}

/**
 * Owns the app's single "active context" — the cluster every other service
 * (namespaces, pods, logs) reads from. Switching context here never touches
 * the user's kubeconfig file; it's purely in-memory app state.
 */
export class ClusterService extends EventEmitter {
  private activeContextName: string | null = null
  private stopWatching: (() => void) | null = null

  constructor(
    private readonly kubeconfigService: KubeconfigService,
    private readonly clientFactory: KubernetesClientFactory,
  ) {
    super()
  }

  /** Reads the kubeconfig, picks an initial active context (whatever
   * `kubectl` currently considers current), and starts watching the file
   * for external `kubectl config use-context` changes. */
  init(): ClusterContextsSnapshot {
    const snapshot = this.kubeconfigService.getSnapshot()
    this.activeContextName = snapshot.currentContext

    this.stopWatching = this.kubeconfigService.watch((fresh) => {
      const wasFollowingFile = this.activeContextName === null || this.activeContextName === snapshot.currentContext
      this.clientFactory.invalidateAll()

      if (wasFollowingFile || !fresh.contexts.some((c) => c.name === this.activeContextName)) {
        this.activeContextName = fresh.currentContext
      }

      this.emit('changed', this.getContextsSnapshot())
    })

    return this.getContextsSnapshot()
  }

  dispose(): void {
    this.stopWatching?.()
  }

  getContextsSnapshot(): ClusterContextsSnapshot {
    const { contexts } = this.kubeconfigService.getSnapshot()
    return {
      contexts: contexts.map((ctx) => ({ ...ctx, isCurrent: ctx.name === this.activeContextName })),
      currentContext: this.activeContextName,
    }
  }

  getActiveContextName(): string | null {
    return this.activeContextName
  }

  getActiveBundle(): KubernetesClientBundle {
    if (!this.activeContextName) {
      throw new Error('No active Kubernetes context selected')
    }
    return this.clientFactory.getBundle(this.activeContextName)
  }

  async setActiveContext(contextName: string): Promise<ClusterContextsSnapshot> {
    const { contexts } = this.kubeconfigService.getSnapshot()
    if (!contexts.some((c) => c.name === contextName)) {
      throw new Error(`Unknown kubeconfig context: "${contextName}"`)
    }

    // Always rebuild this context's client from scratch on activation rather
    // than reusing a cached bundle. The cache is keyed by context name only,
    // so if credentials changed underneath it (e.g. the user ran `gcloud
    // config set account` / `gcloud auth login` for a different identity,
    // which never touches the kubeconfig file) a stale, already-authenticated
    // client would otherwise keep being served indefinitely.
    this.clientFactory.invalidate(contextName)

    this.activeContextName = contextName
    const snapshot = this.getContextsSnapshot()
    this.emit('changed', snapshot)
    return snapshot
  }

  /** Forces the active context's cached client to be rebuilt and re-fetches
   * cluster info. This is the app's explicit "reconnect" affordance — used
   * by the dashboard's Retry button — since switching the active cloud CLI
   * account (`gcloud`/`az`) doesn't touch the kubeconfig file and so never
   * trips the file-watcher-driven invalidation on its own. */
  async refreshActiveContext(): Promise<ClusterInfo> {
    if (!this.activeContextName) {
      throw new Error('No active Kubernetes context selected')
    }
    this.clientFactory.invalidate(this.activeContextName)
    return this.getClusterInfo()
  }

  async testConnection(contextName: string): Promise<ConnectionStatus> {
    try {
      const bundle = this.clientFactory.getBundle(contextName)
      await withTimeout(bundle.versionApi.getCode(), CONNECTION_TIMEOUT_MS, 'Connection test')
      return 'connected'
    } catch (error) {
      console.error(`[ClusterService] connection test failed for "${contextName}":`, error)
      return 'error'
    }
  }

  async getClusterInfo(): Promise<ClusterInfo> {
    if (!this.activeContextName) {
      throw new Error('No active Kubernetes context selected')
    }

    const contextName = this.activeContextName
    const bundle = this.clientFactory.getBundle(contextName)
    const context = bundle.kubeConfig.getContextObject(contextName)
    const cluster = context ? bundle.kubeConfig.getCluster(context.cluster) : null

    const base: Omit<ClusterInfo, 'status' | 'kubernetesVersion' | 'nodeCount' | 'namespaceCount'> = {
      contextName,
      clusterName: context?.cluster ?? contextName,
      provider: classifyProvider(contextName, cluster?.server ?? context?.cluster ?? ''),
      server: cluster?.server ?? '',
    }

    // The version check is what "connected" actually means here (can we
    // reach the API server at all). Nodes and namespaces are fetched
    // independently and degrade to `null` on their own — a user/service
    // account without cluster-wide `list nodes` RBAC/IAM (common on managed
    // GKE/AKS clusters with scoped permissions) shouldn't make the whole
    // cluster look unreachable.
    try {
      const version = await withTimeout(bundle.versionApi.getCode(), CONNECTION_TIMEOUT_MS, 'Version check')

      const [nodeCount, namespaceCount] = await Promise.all([
        withTimeout(bundle.coreV1Api.listNode(), CONNECTION_TIMEOUT_MS, 'Node list')
          .then((r) => r.items.length)
          .catch((error) => {
            console.warn(`[ClusterService] couldn't list nodes for "${contextName}":`, error instanceof Error ? error.message : error)
            return null
          }),
        withTimeout(bundle.coreV1Api.listNamespace(), CONNECTION_TIMEOUT_MS, 'Namespace list')
          .then((r) => r.items.length)
          .catch((error) => {
            console.warn(`[ClusterService] couldn't list namespaces for "${contextName}":`, error instanceof Error ? error.message : error)
            return null
          }),
      ])

      return {
        ...base,
        status: 'connected',
        kubernetesVersion: version.gitVersion ?? null,
        nodeCount,
        namespaceCount,
      }
    } catch (error) {
      console.error(`[ClusterService] failed to load cluster info for "${contextName}":`, error)
      return {
        ...base,
        status: 'error',
        kubernetesVersion: null,
        nodeCount: null,
        namespaceCount: null,
      }
    }
  }
}
