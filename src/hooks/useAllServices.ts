import { useCallback, useEffect, useState } from 'react'

import { kubernetesApi } from '@/services/kubernetesApi'
import { useClusterStore } from '@/stores/useClusterStore'
import type { RequestStatus } from '@/types/ui'
import type { ServiceSummary } from '@shared/types'

/** Cluster-wide Service snapshot, independent of the sidebar's namespace
 * filter — the Dashboard always reports totals for the whole cluster.
 * Mirrors {@link useAllPods}. */
export function useAllServices(contextName: string | null) {
  const refreshGeneration = useClusterStore((s) => s.refreshGeneration)
  const [services, setServices] = useState<ServiceSummary[]>([])
  const [status, setStatus] = useState<RequestStatus>('idle')
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (!contextName) return
    setStatus('loading')
    setError(null)
    try {
      setServices(await kubernetesApi.services.list('all'))
      setStatus('success')
    } catch (err) {
      setStatus('error')
      setError(err instanceof Error ? err.message : String(err))
    }
  }, [contextName])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refresh()
  }, [refresh, refreshGeneration])

  return { services, status, error, refresh }
}
