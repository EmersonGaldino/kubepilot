import { ServerCog } from 'lucide-react'
import { useEffect, useState } from 'react'

import { ResourcePage } from '@/components/common/ResourcePage'
import { NodeDetailsDrawer } from '@/components/nodes/NodeDetailsDrawer'
import { NodeTable } from '@/components/nodes/NodeTable'
import { useClusterStore } from '@/stores/useClusterStore'
import { useNodeStore } from '@/stores/useNodeStore'
import type { NodeSummary } from '@shared/types'

function searchText(node: NodeSummary) {
  return `${node.name} ${node.roles} ${node.kubeletVersion ?? ''} ${node.ready ? 'ready' : 'notready'}`
}

export function Nodes() {
  const nodes = useNodeStore((s) => s.nodes)
  const status = useNodeStore((s) => s.status)
  const error = useNodeStore((s) => s.error)
  const loadNodes = useNodeStore((s) => s.loadNodes)
  const loadNodeDetail = useNodeStore((s) => s.loadNodeDetail)
  const clearSelectedNode = useNodeStore((s) => s.clearSelectedNode)
  const selectedNode = useNodeStore((s) => s.selectedNode)
  const selectedNodeStatus = useNodeStore((s) => s.selectedNodeStatus)
  const currentContext = useClusterStore((s) => s.currentContext)
  const refreshGeneration = useClusterStore((s) => s.refreshGeneration)
  const [drawerOpen, setDrawerOpen] = useState(false)

  useEffect(() => {
    void loadNodes()
  }, [loadNodes, currentContext, refreshGeneration])

  return (
    <>
      <ResourcePage
        title="Nodes"
        countNoun="nodes"
        items={nodes}
        getSearchText={searchText}
        status={status}
        error={error}
        onRetry={() => void loadNodes()}
        emptyIcon={ServerCog}
        emptyTitle="No nodes found"
        emptyDescription="This cluster has no nodes, or your credentials cannot list them."
      >
        {(filtered) => (
          <NodeTable
            nodes={filtered}
            onSelect={(node) => {
              setDrawerOpen(true)
              void loadNodeDetail(node.name)
            }}
          />
        )}
      </ResourcePage>
      {drawerOpen && (
        <NodeDetailsDrawer
          node={selectedNode}
          loading={selectedNodeStatus === 'loading'}
          onClose={() => {
            setDrawerOpen(false)
            clearSelectedNode()
          }}
        />
      )}
    </>
  )
}
