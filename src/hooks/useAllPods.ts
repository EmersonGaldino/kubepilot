import { useCallback, useEffect, useState } from 'react'

import { kubernetesApi } from '@/services/kubernetesApi'
import type { RequestStatus } from '@/types/ui'
import type { PodSummary } from '@shared/types'

/** Cluster-wide pod snapshot, independent of the sidebar's namespace filter
 * — the Dashboard always reports totals for the whole cluster. */
export function useAllPods(contextName: string | null) {
  const [pods, setPods] = useState<PodSummary[]>([])
  const [status, setStatus] = useState<RequestStatus>('idle')
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (!contextName) return
    setStatus('loading')
    setError(null)
    try {
      setPods(await kubernetesApi.pods.list('all'))
      setStatus('success')
    } catch (err) {
      setStatus('error')
      setError(err instanceof Error ? err.message : String(err))
    }
  }, [contextName])

  useEffect(() => {
    // Intentional: `refresh` sets a "loading" flag synchronously before its
    // first `await` so the Dashboard can show a skeleton immediately on
    // mount and on every context switch, not just after data arrives.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refresh()
  }, [refresh])

  return { pods, status, error, refresh }
}
