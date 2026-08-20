import { useEffect } from 'react'

import { kubernetesApi } from '@/services/kubernetesApi'
import { resetAllResourceStores } from '@/stores/resetResourceStores'
import { useClusterStore } from '@/stores/useClusterStore'
import { useDeploymentStore } from '@/stores/useDeploymentStore'
import { useNamespaceStore } from '@/stores/useNamespaceStore'
import { usePodStore } from '@/stores/usePodStore'

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
    resetAllResourceStores()
    void loadClusterInfo()
    void loadNamespaces()
  }, [currentContext, loadClusterInfo, loadNamespaces])

  useEffect(() => {
    if (!currentContext) return
    void loadPods(selectedNamespace)
    void loadDeployments(selectedNamespace)
  }, [currentContext, selectedNamespace, loadPods, loadDeployments])
}
