import { AlertTriangle } from 'lucide-react'

import { Button } from '@/components/ui/Button'
import { useEscapeKey } from '@/hooks/useEscapeKey'

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Delete',
  danger = true,
  busy = false,
  onConfirm,
  onCancel,
}: {
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  danger?: boolean
  busy?: boolean
  onConfirm: () => void
  onCancel: () => void
}) {
  useEscapeKey(onCancel, open, true)

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onCancel}>
      <div
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
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="ghost" onClick={onCancel} disabled={busy}>
            Cancel
          </Button>
          <Button variant={danger ? 'danger' : 'primary'} onClick={onConfirm} disabled={busy}>
            {busy ? 'Working…' : confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  )
}
