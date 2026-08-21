import { AlertTriangle } from 'lucide-react'
import { useRef, useState } from 'react'

import { Button } from '@/components/ui/Button'
import { useEscapeKey } from '@/hooks/useEscapeKey'
import { useFocusTrap } from '@/hooks/useFocusTrap'
import { useClusterPrefsStore } from '@/stores/useClusterPrefsStore'
import { useClusterStore } from '@/stores/useClusterStore'

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Delete',
  danger = true,
  busy = false,
  confirmationText,
  onConfirm,
  onCancel,
}: {
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  danger?: boolean
  busy?: boolean
  /** When provided, the user must type this exact value before confirming. */
  confirmationText?: string
  onConfirm: () => void
  onCancel: () => void
}) {
  const dialogRef = useRef<HTMLDivElement>(null)
  const [typedConfirmation, setTypedConfirmation] = useState('')
  const currentContext = useClusterStore((state) => state.currentContext)
  const isProduction = useClusterPrefsStore((state) => currentContext ? state.profiles[currentContext] === 'production' : false)
  useEscapeKey(onCancel, open, true)
  useFocusTrap(dialogRef, open)

  const requiredConfirmation = confirmationText ?? (danger && isProduction ? title.match(/^Delete (.+?)\?$/)?.[1] : undefined)

  const cancel = () => {
    setTypedConfirmation('')
    onCancel()
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={cancel}>
      <div
        ref={dialogRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        className="w-full max-w-sm rounded-xl border border-border-subtle bg-surface-1 p-5 shadow-panel"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3">
          {danger && (
            <div className="shrink-0 rounded-full bg-red-500/10 p-2">
              <AlertTriangle className="h-5 w-5 text-danger" strokeWidth={1.5} />
            </div>
          )}
          <div className="flex-1">
            <h3 id="confirm-title" className="text-sm font-semibold text-fg">
              {title}
            </h3>
            <p className="mt-1 text-sm leading-relaxed text-fg-muted">{message}</p>
          </div>
        </div>
        {requiredConfirmation && (
          <label className="mt-4 block text-xs text-fg-muted">
            Type <span className="font-mono text-fg">{requiredConfirmation}</span> to continue
            <input
              autoFocus
              value={typedConfirmation}
              onChange={(event) => setTypedConfirmation(event.target.value)}
              className="kp-control mt-1.5 h-9 w-full font-mono"
              aria-label={`Type ${requiredConfirmation} to confirm`}
            />
          </label>
        )}
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="ghost" onClick={cancel} disabled={busy}>
            Cancel
          </Button>
          <Button variant={danger ? 'danger' : 'primary'} onClick={onConfirm} disabled={busy || (requiredConfirmation !== undefined && typedConfirmation !== requiredConfirmation)}>
            {busy ? 'Working…' : confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  )
}
