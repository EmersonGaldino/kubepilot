import { useEffect, useState } from 'react'

import { useClusterStore } from '@/stores/useClusterStore'

/** Gates the splash screen's visibility: it stays up until the kubeconfig
 * has been read (`contextsStatus` resolves, success or error) AND at least
 * `minMs` has passed since mount — the minimum keeps the splash from just
 * flashing on a fast local kubeconfig read, since it exists to be seen, not
 * just to block interaction. Returns `true` once both conditions are met,
 * i.e. once the caller should start fading the splash out. */
export function useSplashGate(minMs: number): boolean {
  const contextsStatus = useClusterStore((s) => s.contextsStatus)
  const [minTimeElapsed, setMinTimeElapsed] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setMinTimeElapsed(true), minMs)
    return () => clearTimeout(timer)
  }, [minMs])

  const dataReady = contextsStatus === 'success' || contextsStatus === 'error'
  return dataReady && minTimeElapsed
}
