import { useEffect, useRef, useState } from 'react'

import { kubernetesApi } from '@/services/kubernetesApi'

export interface PodLogStreamParams {
  namespace: string
  podName: string
  containerName?: string
  tailLines: number
  timestamps: boolean
}

/** Opens a live "follow" log stream (`kubectl logs -f` equivalent) for one
 * pod/container and keeps it running for as long as the caller stays
 * mounted, restarting the stream whenever the target or its options change.
 * Used by {@link DeploymentLogsView} to tail every pod behind a workload at
 * once — each pane gets its own independent stream via this hook. */
export function usePodLogStream({ namespace, podName, containerName, tailLines, timestamps }: PodLogStreamParams) {
  const [lines, setLines] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const streamIdRef = useRef<string | null>(null)

  useEffect(() => {
    let cancelled = false
    let unsubscribe: (() => void) | null = null

    // Intentional: reset synchronously before the stream (re)opens below, so
    // switching pods/containers never briefly shows the previous target's lines.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLines([])
    setError(null)

    void kubernetesApi.logs
      .streamStart({ namespace, podName, containerName, tailLines, timestamps })
      .then(({ streamId }) => {
        if (cancelled) {
          void kubernetesApi.logs.streamStop(streamId)
          return
        }
        streamIdRef.current = streamId
        unsubscribe = kubernetesApi.logs.subscribe(streamId, {
          onData: (newLines) => setLines((prev) => [...prev, ...newLines]),
          onError: (err) => setError(err),
          onEnd: () => {
            streamIdRef.current = null
          },
        })
      })
      .catch((err) => setError(err instanceof Error ? err.message : String(err)))

    return () => {
      cancelled = true
      unsubscribe?.()
      if (streamIdRef.current) {
        void kubernetesApi.logs.streamStop(streamIdRef.current)
        streamIdRef.current = null
      }
    }
  }, [namespace, podName, containerName, tailLines, timestamps])

  return { lines, error }
}
