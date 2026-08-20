import {
  AppsV1Api,
  AutoscalingV2Api,
  BatchV1Api,
  CoreV1Api,
  KubeConfig,
  Log,
  NetworkingV1Api,
  StorageV1Api,
  VersionApi,
} from '@kubernetes/client-node'

export interface KubernetesClientBundle {
  kubeConfig: KubeConfig
  coreV1Api: CoreV1Api
  appsV1Api: AppsV1Api
  batchV1Api: BatchV1Api
  networkingV1Api: NetworkingV1Api
  autoscalingV2Api: AutoscalingV2Api
  storageV1Api: StorageV1Api
  versionApi: VersionApi
  log: Log
}

/**
 * Builds (and memoizes) the `@kubernetes/client-node` clients for a given
 * kubeconfig context. Every read in the app funnels through here so a
 * context is only ever parsed/authenticated once per session.
 */
export class KubernetesClientFactory {
  private cache = new Map<string, KubernetesClientBundle>()

  getBundle(contextName: string): KubernetesClientBundle {
    const cached = this.cache.get(contextName)
    if (cached) return cached

    const kubeConfig = new KubeConfig()
    kubeConfig.loadFromDefault()

    if (!kubeConfig.getContextObject(contextName)) {
      throw new Error(`Unknown kubeconfig context: "${contextName}"`)
    }
    kubeConfig.setCurrentContext(contextName)

    const bundle: KubernetesClientBundle = {
      kubeConfig,
      coreV1Api: kubeConfig.makeApiClient(CoreV1Api),
      appsV1Api: kubeConfig.makeApiClient(AppsV1Api),
      batchV1Api: kubeConfig.makeApiClient(BatchV1Api),
      networkingV1Api: kubeConfig.makeApiClient(NetworkingV1Api),
      autoscalingV2Api: kubeConfig.makeApiClient(AutoscalingV2Api),
      storageV1Api: kubeConfig.makeApiClient(StorageV1Api),
      versionApi: kubeConfig.makeApiClient(VersionApi),
      log: new Log(kubeConfig),
    }

    this.cache.set(contextName, bundle)
    return bundle
  }

  /** Drops the cached bundle for a single context, forcing the next
   * `getBundle` call to rebuild it from a freshly-parsed kubeconfig. Used
   * whenever a context becomes active again, since the credentials behind
   * it may have changed without the kubeconfig file itself changing (e.g.
   * switching the active `gcloud`/`az` CLI account doesn't rewrite
   * `~/.kube/config`, so a cached exec/auth-provider token would otherwise
   * keep authenticating as the old identity until it naturally expires). */
  invalidate(contextName: string): void {
    this.cache.delete(contextName)
  }

  /** Drops every cached client bundle. Called whenever the kubeconfig file
   * changes on disk, since credentials for an already-cached context may
   * have rotated (e.g. a refreshed cloud-provider auth token). */
  invalidateAll(): void {
    this.cache.clear()
  }
}
