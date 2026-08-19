import { create } from 'zustand'

import { kubernetesApi } from '@/services/kubernetesApi'
import type { RequestStatus } from '@/types/ui'
import type { ClusterInfo, KubeContext } from '@shared/types'

interface ClusterState {
  contexts: KubeContext[]
  currentContext: string | null
  clusterInfo: ClusterInfo | null
  contextsStatus: RequestStatus
  infoStatus: RequestStatus
  error: string | null

  loadContexts: () => Promise<void>
  loadClusterInfo: () => Promise<void>
  refreshClusterInfo: () => Promise<void>
  switchContext: (contextName: string) => Promise<void>
  applyContextsSnapshot: (snapshot: { contexts: KubeContext[]; currentContext: string | null }) => void
}

export const useClusterStore = create<ClusterState>((set, get) => ({
  contexts: [],
  currentContext: null,
  clusterInfo: null,
  contextsStatus: 'idle',
  infoStatus: 'idle',
  error: null,

  applyContextsSnapshot: (snapshot) => {
    set({ contexts: snapshot.contexts, currentContext: snapshot.currentContext, contextsStatus: 'success' })
  },

  loadContexts: async () => {
    set({ contextsStatus: 'loading', error: null })
    try {
      const snapshot = await kubernetesApi.kubeconfig.getContexts()
      get().applyContextsSnapshot(snapshot)
    } catch (error) {
      set({ contextsStatus: 'error', error: error instanceof Error ? error.message : String(error) })
    }
  },

  loadClusterInfo: async () => {
    if (!get().currentContext) {
      set({ clusterInfo: null, infoStatus: 'idle' })
      return
    }
    set({ infoStatus: 'loading', error: null })
    try {
      const clusterInfo = await kubernetesApi.cluster.getInfo()
      set({ clusterInfo, infoStatus: 'success' })
    } catch (error) {
      set({ infoStatus: 'error', error: error instanceof Error ? error.message : String(error) })
    }
  },

  // Unlike loadClusterInfo, this forces the main process to rebuild the
  // active context's Kubernetes client before re-fetching — needed to
  // recover after switching the active `gcloud`/`az` CLI account, since
  // that never rewrites the kubeconfig file and so a plain reload would
  // just get served the same stale, already-authenticated client.
  refreshClusterInfo: async () => {
    if (!get().currentContext) {
      set({ clusterInfo: null, infoStatus: 'idle' })
      return
    }
    set({ infoStatus: 'loading', error: null })
    try {
      const clusterInfo = await kubernetesApi.cluster.refresh()
      set({ clusterInfo, infoStatus: 'success' })
    } catch (error) {
      set({ infoStatus: 'error', error: error instanceof Error ? error.message : String(error) })
    }
  },

  switchContext: async (contextName: string) => {
    set({ contextsStatus: 'loading', error: null })
    try {
      const snapshot = await kubernetesApi.kubeconfig.setContext(contextName)
      get().applyContextsSnapshot(snapshot)
      await get().loadClusterInfo()
    } catch (error) {
      set({ contextsStatus: 'error', error: error instanceof Error ? error.message : String(error) })
    }
  },
}))
