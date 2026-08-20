import type { ReactNode } from 'react'
import { useEffect, useState } from 'react'

import { Button } from '@/components/ui/Button'
import { kubernetesApi } from '@/services/kubernetesApi'
import type { PortForwardSession, PortForwardTargetKind } from '@shared/types'

export function PortForwardPanel({
  kind,
  namespace,
  name,
  defaultTargetPort,
}: {
  kind: PortForwardTargetKind
  namespace: string
  name: string
  defaultTargetPort?: number
}) {
  const [localPort, setLocalPort] = useState(8080)
  const [targetPort, setTargetPort] = useState(defaultTargetPort ?? 80)
  const [sessions, setSessions] = useState<PortForwardSession[]>([])
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const refresh = async () => {
    setSessions(await kubernetesApi.portforward.list())
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refresh()
  }, [])

  const mine = sessions.filter((s) => s.kind === kind && s.namespace === namespace && s.name === name)

  const start = async () => {
    setBusy(true)
    setError(null)
    try {
      await kubernetesApi.portforward.start({ kind, namespace, name, localPort, targetPort })
      await refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setBusy(false)
    }
  }

  const stop = async (id: string) => {
    setBusy(true)
    setError(null)
    try {
      await kubernetesApi.portforward.stop(id)
      await refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-fg-subtle">Port-forward</h3>
      <div className="flex flex-wrap items-end gap-2">
        <Field label="Local">
          <input
            type="number"
            min={1}
            max={65535}
            value={localPort}
            onChange={(e) => setLocalPort(Number(e.target.value))}
            className="kp-control h-8 w-20 rounded-md border border-border-subtle bg-surface-0 px-2 text-xs tabular-nums"
          />
        </Field>
        <Field label="Target">
          <input
            type="number"
            min={1}
            max={65535}
            value={targetPort}
            onChange={(e) => setTargetPort(Number(e.target.value))}
            className="kp-control h-8 w-20 rounded-md border border-border-subtle bg-surface-0 px-2 text-xs tabular-nums"
          />
        </Field>
        <Button variant="secondary" disabled={busy} onClick={() => void start()}>
          Forward
        </Button>
      </div>
      {mine.length > 0 && (
        <ul className="mt-2 space-y-1">
          {mine.map((session) => (
            <li key={session.id} className="flex items-center justify-between text-xs text-fg-muted">
              <span>
                127.0.0.1:{session.localPort} → {session.targetPort}
              </span>
              <button type="button" className="text-danger hover:underline" onClick={() => void stop(session.id)}>
                Stop
              </button>
            </li>
          ))}
        </ul>
      )}
      {error && <p className="mt-1 text-xs text-danger">{error}</p>}
    </div>
  )
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="text-xs text-fg-subtle">
      {label}
      <div className="mt-0.5">{children}</div>
    </label>
  )
}
