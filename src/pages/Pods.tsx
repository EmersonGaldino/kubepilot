import { Boxes } from 'lucide-react'
import { useState } from 'react'

import { ResourcePage } from '@/components/common/ResourcePage'
import { PodDetailsDrawer } from '@/components/pods/PodDetailsDrawer'
import { PodTable } from '@/components/pods/PodTable'
import { useNamespaceStore } from '@/stores/useNamespaceStore'
import { usePodStore } from '@/stores/usePodStore'
import type { PodSummary } from '@shared/types'

function podSearchText(pod: PodSummary) {
  return `${pod.name} ${pod.namespace} ${pod.node ?? ''} ${pod.phase}`
}

export function Pods() {
  const pods = usePodStore((s) => s.pods)
  const status = usePodStore((s) => s.status)
  const error = usePodStore((s) => s.error)
  const loadPods = usePodStore((s) => s.loadPods)
  const loadPodDetail = usePodStore((s) => s.loadPodDetail)
  const clearSelectedPod = usePodStore((s) => s.clearSelectedPod)
  const selectedPod = usePodStore((s) => s.selectedPod)
  const selectedPodStatus = usePodStore((s) => s.selectedPodStatus)

  const namespaceFilter = useNamespaceStore((s) => s.selected)

  const [drawerOpen, setDrawerOpen] = useState(false)

  const handleSelect = (pod: PodSummary) => {
    setDrawerOpen(true)
    void loadPodDetail(pod.namespace, pod.name)
  }

  const handleClose = () => {
    setDrawerOpen(false)
    clearSelectedPod()
  }

  return (
    <>
      <ResourcePage
        title="Pods"
        countNoun="pods"
        items={pods}
        getSearchText={podSearchText}
        status={status}
        error={error}
        onRetry={() => void loadPods(namespaceFilter)}
        emptyIcon={Boxes}
        emptyTitle="No pods found"
        emptyDescription="This namespace has no pods, or the cluster is empty."
        searchPlaceholder="Filter by name, namespace, node…"
      >
        {(filtered) => <PodTable pods={filtered} namespaceFilter={namespaceFilter} onSelect={handleSelect} />}
      </ResourcePage>

      {drawerOpen && (
        <PodDetailsDrawer pod={selectedPod} loading={selectedPodStatus === 'loading'} onClose={handleClose} />
      )}
    </>
  )
}
