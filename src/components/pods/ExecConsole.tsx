import { X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import { IconButton } from '@/components/ui/IconButton'
import { useEscapeKey } from '@/hooks/useEscapeKey'
import { useExecSession } from '@/hooks/useExecSession'
import { useClusterStore } from '@/stores/useClusterStore'
import { useWorkspaceStore } from '@/stores/useWorkspaceStore'

export function ExecConsole({
  namespace,
  podName,
  containerName,
  onClose,
}: {
  namespace: string
  podName: string
  containerName?: string
  onClose: () => void
}) {
  const { output, error, write } = useExecSession({ namespace, podName, containerName })
  const currentContext = useClusterStore((state) => state.currentContext)
  const addActivity = useWorkspaceStore((state) => state.addOrUpdate)
  const setActivityState = useWorkspaceStore((state) => state.setState)
  const [input, setInput] = useState('')
  const outputRef = useRef<HTMLDivElement>(null)
  useEscapeKey(onClose, true, true)

  useEffect(() => {
    const el = outputRef.current
    if (!el) return
    el.scrollTop = el.scrollHeight
  }, [output])

  useEffect(() => {
    const id = `exec:${namespace}/${podName}:${containerName ?? ''}`
    addActivity({
      id,
      kind: 'exec',
      state: 'live',
      title: `Exec · ${podName}`,
      contextName: currentContext,
      namespace,
      resourceName: podName,
      containerName,
      route: '/pods',
    })
    return () => setActivityState(id, 'ended')
  }, [addActivity, containerName, currentContext, namespace, podName, setActivityState])

  const submit = () => {
    write(`${input}\n`)
    setInput('')
  }

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/60 p-6" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="exec-title"
        className="flex h-full max-h-[85vh] w-full max-w-3xl flex-col rounded-xl border border-border-subtle bg-surface-1 shadow-panel"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border-subtle px-4 py-3">
          <h2 id="exec-title" className="truncate text-sm font-semibold text-fg">
            {namespace}/{podName} · {containerName ?? 'default container'}
          </h2>
          <IconButton label="Close exec" onClick={onClose}>
            <X className="h-4 w-4" />
          </IconButton>
        </div>

        <div className="relative flex flex-1 flex-col overflow-hidden bg-black/40">
          <div ref={outputRef} className="flex-1 overflow-y-auto px-4 py-3 font-mono text-[13px] leading-relaxed">
            {output.length === 0 ? (
              <p className="text-fg-subtle">No output yet.</p>
            ) : (
              <pre className="whitespace-pre-wrap break-all text-fg-muted">{output}</pre>
            )}
          </div>
        </div>

        <div className="border-t border-border-subtle p-3">
          {error && (
            <p className="mb-2 text-xs text-danger" role="alert">
              {error}
            </p>
          )}
          <input
            type="text"
            autoFocus
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') submit()
            }}
            placeholder="Type a command and press Enter…"
            aria-label="Command"
            className="kp-control h-9 w-full font-mono"
          />
        </div>
      </div>
    </div>
  )
}
