import { useEffect, useRef, useState } from 'react'

import { kubernetesApi } from '@/services/kubernetesApi'

export interface ExecSessionParams {
  namespace: string
  podName: string
  containerName?: string
}

/** Opens an interactive exec session (`kubectl exec` equivalent) inside one
 * pod/container and keeps it running for as long as the caller stays
 * mounted, restarting the session whenever the target changes. Mirrors
 * {@link usePodLogStream}'s structure — same start/subscribe/cleanup shape,
 * just wired to the exec channel instead of the logs channel. Used by
 * {@link ExecConsole} to back the Pod drawer's "Exec" action. */
export function useExecSession({ namespace, podName, containerName }: ExecSessionParams) {
  const [output, setOutput] = useState('')
  const [error, setError] = useState<string | null>(null)
  const execIdRef = useRef<string | null>(null)

  useEffect(() => {
    let cancelled = false
    let unsubscribe: (() => void) | null = null

    // Intentional: reset synchronously before the session (re)opens below, so
    // switching pods/containers never briefly shows the previous target's output.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOutput('')
    setError(null)

    void kubernetesApi.exec
      .start({ namespace, podName, containerName })
      .then(({ execId }) => {
        if (cancelled) {
          void kubernetesApi.exec.stop(execId)
          return
        }
        execIdRef.current = execId
        unsubscribe = kubernetesApi.exec.subscribe(execId, {
          onData: (chunk) => setOutput((prev) => prev + chunk),
          onError: (err) => setError(err),
          onEnd: () => {
            execIdRef.current = null
          },
        })
      })
      .catch((err) => setError(err instanceof Error ? err.message : String(err)))

    return () => {
      cancelled = true
      unsubscribe?.()
      if (execIdRef.current) {
        void kubernetesApi.exec.stop(execIdRef.current)
        execIdRef.current = null
      }
    }
  }, [namespace, podName, containerName])

  const write = (line: string) => {
    if (!execIdRef.current) return
    void kubernetesApi.exec.write(execIdRef.current, line)
  }

  return { output, error, write }
}
