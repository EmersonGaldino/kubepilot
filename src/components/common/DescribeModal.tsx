import { Copy, X } from 'lucide-react'
import { useState } from 'react'

import { Button } from '@/components/ui/Button'
import { IconButton } from '@/components/ui/IconButton'
import { useEscapeKey } from '@/hooks/useEscapeKey'

export function DescribeModal({
  open,
  title,
  yaml,
  loading,
  error,
  onClose,
}: {
  open: boolean
  title: string
  yaml: string | null
  loading: boolean
  error: string | null
  onClose: () => void
}) {
  const [copied, setCopied] = useState(false)
  useEscapeKey(onClose, open, true)

  if (!open) return null

  const copy = () => {
    if (!yaml) return
    void navigator.clipboard.writeText(yaml).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/60 p-6" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="describe-title"
        className="flex h-full max-h-[85vh] w-full max-w-3xl flex-col rounded-xl border border-border-subtle bg-surface-1 shadow-panel"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border-subtle px-4 py-3">
          <h2 id="describe-title" className="truncate text-sm font-semibold text-fg">
            {title}
          </h2>
          <div className="flex items-center gap-1.5">
            <Button variant="ghost" onClick={copy} disabled={!yaml}>
              <Copy className="h-3.5 w-3.5" />
              {copied ? 'Copied' : 'Copy'}
            </Button>
            <IconButton label="Close" onClick={onClose}>
              <X className="h-4 w-4" />
            </IconButton>
          </div>
        </div>
        <div className="flex-1 overflow-auto p-4">
          {loading && <p className="text-xs text-fg-muted">Loading…</p>}
          {error && (
            <p className="text-xs text-danger" role="alert">
              {error}
            </p>
          )}
          {yaml && <pre className="whitespace-pre-wrap break-all font-mono text-xs leading-relaxed text-fg-muted">{yaml}</pre>}
        </div>
      </div>
    </div>
  )
}
