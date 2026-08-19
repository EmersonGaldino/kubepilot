import { useEffect } from 'react'

import { kubernetesApi } from '@/services/kubernetesApi'
import { useClusterStore } from '@/stores/useClusterStore'
import { useDeploymentStore } from '@/stores/useDeploymentStore'
import { useNamespaceStore } from '@/stores/useNamespaceStore'
import { usePodStore } from '@/stores/usePodStore'

/**
 * Central data-flow coordinator, mounted once at the app root.
 *
 * - Loads kubeconfig contexts on startup and stays subscribed to external
 *   changes (e.g. `kubectl config use-context` run in a terminal).
 * - Whenever the active context changes, reloads cluster info + namespaces.
 * - Whenever the active context OR the selected namespace changes, reloads
 *   pods and deployments — this is what makes the global namespace selector
 *   (section 14) propagate to every screen automatically.
 */
export function useKubepilotBootstrap(): void {
  const loadContexts = useClusterStore((s) => s.loadContexts)
  const applyContextsSnapshot = useClusterStore((s) => s.applyContextsSnapshot)
  const loadClusterInfo = useClusterStore((s) => s.loadClusterInfo)
  const currentContext = useClusterStore((s) => s.currentContext)

  const loadNamespaces = useNamespaceStore((s) => s.loadNamespaces)
  const selectedNamespace = useNamespaceStore((s) => s.selected)

  const loadPods = usePodStore((s) => s.loadPods)
  const loadDeployments = useDeploymentStore((s) => s.loadDeployments)

  useEffect(() => {
    void loadContexts()
    return kubernetesApi.kubeconfig.onChanged((snapshot) => applyContextsSnapshot(snapshot))
  }, [loadContexts, applyContextsSnapshot])

  useEffect(() => {
    if (!currentContext) return
    void loadClusterInfo()
    void loadNamespaces()
  }, [currentContext, loadClusterInfo, loadNamespaces])

  useEffect(() => {
    if (!currentContext) return
    void loadPods(selectedNamespace)
    void loadDeployments(selectedNamespace)
  }, [currentContext, selectedNamespace, loadPods, loadDeployments])
}
