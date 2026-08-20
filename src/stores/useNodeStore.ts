import { create } from 'zustand'

import { beginClusterRequest, isSameClusterRequest } from '@/lib/clusterRequest'
import { kubernetesApi } from '@/services/kubernetesApi'
import type { RequestStatus } from '@/types/ui'
import type { NodeDetail, NodeSummary } from '@shared/types'

interface NodeState {
  nodes: NodeSummary[]
  status: RequestStatus
  error: string | null
  selectedNode: NodeDetail | null
  selectedNodeStatus: RequestStatus
  loadNodes: () => Promise<void>
  loadNodeDetail: (name: string) => Promise<void>
  clearSelectedNode: () => void
}

export const useNodeStore = create<NodeState>((set) => ({
  nodes: [],
  status: 'idle',
  error: null,
  selectedNode: null,
  selectedNodeStatus: 'idle',

  loadNodes: async () => {
    const request = beginClusterRequest()
    set({ status: 'loading', error: null })
    try {
      const nodes = await kubernetesApi.nodes.list()
      if (!isSameClusterRequest(request)) return
      set({ nodes, status: 'success' })
    } catch (error) {
      if (!isSameClusterRequest(request)) return
      set({ status: 'error', error: error instanceof Error ? error.message : String(error) })
    }
  },

  loadNodeDetail: async (name) => {
    const request = beginClusterRequest()
    set({ selectedNodeStatus: 'loading' })
    try {
      const selectedNode = await kubernetesApi.nodes.get(name)
      if (!isSameClusterRequest(request)) return
      set({ selectedNode, selectedNodeStatus: 'success' })
    } catch (error) {
      if (!isSameClusterRequest(request)) return
      set({ selectedNodeStatus: 'error', error: error instanceof Error ? error.message : String(error) })
    }
  },

  clearSelectedNode: () => set({ selectedNode: null, selectedNodeStatus: 'idle' }),
}))
