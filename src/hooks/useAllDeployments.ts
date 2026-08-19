import { useCallback, useEffect, useState } from 'react'

import { kubernetesApi } from '@/services/kubernetesApi'
import type { RequestStatus } from '@/types/ui'
import type { DeploymentSummary } from '@shared/types'

/** Cluster-wide deployment snapshot, independent of the sidebar's namespace
 * filter — the Dashboard always reports totals for the whole cluster.
 * Mirrors {@link useAllPods}. */
export function useAllDeployments(contextName: string | null) {
  const [deployments, setDeployments] = useState<DeploymentSummary[]>([])
  const [status, setStatus] = useState<RequestStatus>('idle')
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (!contextName) return
    setStatus('loading')
    setError(null)
    try {
      setDeployments(await kubernetesApi.deployments.list('all'))
      setStatus('success')
    } catch (err) {
      setStatus('error')
      setError(err instanceof Error ? err.message : String(err))
    }
  }, [contextName])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refresh()
  }, [refresh])

  return { deployments, status, error, refresh }
}
