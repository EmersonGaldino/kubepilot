import { AlignLeft, Copy, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import type { editor } from 'monaco-editor'

import { Button } from '@/components/ui/Button'
import { IconButton } from '@/components/ui/IconButton'
import { kubernetesApi } from '@/services/kubernetesApi'
import type { ApplyResult, DescribableKind } from '@shared/types'

import { ConfirmDialog } from './ConfirmDialog'
import { YamlEditor } from './YamlEditor'

function monacoUsesEscape(): boolean {
  return Boolean(
    document.querySelector(
            '.suggest-widget.visible, .monaco-hover.visible, .parameter-hints-widget.visible',
    ),
  )
}

export function DescribeModal({
  open,
  title,
  yaml,
  loading,
  error,
  onClose,
  onApplied,
  secretWarning = false,
  readOnly = false,
  kind,
}: {
  open: boolean
  title: string
  yaml: string | null
  loading: boolean
  error: string | null
  onClose: () => void
  onApplied?: () => void
  secretWarning?: boolean
  readOnly?: boolean
  kind?: DescribableKind
}) {
  const [draft, setDraft] = useState('')
  const [copied, setCopied] = useState(false)
  const [applyError, setApplyError] = useState<string | null>(null)
  const [applyMessage, setApplyMessage] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [confirmApply, setConfirmApply] = useState(false)
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null)

  useEffect(() => {
    if (!open || confirmApply) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      if (monacoUsesEscape()) return
      event.preventDefault()
      event.stopPropagation()
      onClose()
    }

    window.addEventListener('keydown', handleKeyDown, { capture: true })
    return () => window.removeEventListener('keydown', handleKeyDown, { capture: true })
  }, [open, confirmApply, onClose])

  useEffect(() => {
    // Sync the editor when a new describe payload arrives.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDraft(yaml ?? '')
    setApplyError(null)
    setApplyMessage(null)
  }, [yaml, open])

  if (!open) return null

  const text = draft || yaml || ''

  const copy = () => {
    if (!text) return
    void navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }

  const format = () => {
    void editorRef.current?.getAction('editor.action.formatDocument')?.run()
  }

  const runApply = async (dryRun: boolean) => {
    setBusy(true)
    setApplyError(null)
    setApplyMessage(null)
    try {
      const result: ApplyResult = await kubernetesApi.apply.run({ yaml: text, dryRun })
      const action = result.created ? 'created' : 'applied'
      setApplyMessage(
        dryRun
          ? `Dry-run OK — would ${action} ${result.kind}/${result.name}`
          : `${result.kind}/${result.name} ${action}`,
      )
      if (!dryRun) onApplied?.()
    } catch (err) {
      setApplyError(err instanceof Error ? err.message : String(err))
    } finally {
      setBusy(false)
      setConfirmApply(false)
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 p-6" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="describe-title"
        className="flex h-[85vh] w-full max-w-3xl flex-col rounded-xl border border-border-subtle bg-surface-1 shadow-panel"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-border-subtle px-4 py-3">
          <h2 id="describe-title" className="truncate text-sm font-semibold text-fg">
            {title}
          </h2>
          <div className="flex items-center gap-1.5">
            <Button variant="ghost" onClick={format} disabled={!text || loading}>
              <AlignLeft className="h-3.5 w-3.5" />
              Format
            </Button>
            <Button variant="ghost" onClick={copy} disabled={!text}>
              <Copy className="h-3.5 w-3.5" />
              {copied ? 'Copied' : 'Copy'}
            </Button>
            <IconButton label="Close" onClick={onClose}>
              <X className="h-4 w-4" />
            </IconButton>
          </div>
        </div>
        <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-hidden p-4">
          {loading && <p className="shrink-0 text-xs text-fg-muted">Loading…</p>}
          {error && (
            <p className="shrink-0 text-xs text-danger" role="alert">
              {error}
            </p>
          )}
          {secretWarning && (
            <p className="shrink-0 text-xs text-warning">
              Applying YAML will send Secret values to the API. Values are visible in this editor.
            </p>
          )}
          <YamlEditor
            value={text}
            onChange={setDraft}
            readOnly={readOnly || loading}
            kind={kind}
            onReady={(instance) => {
              editorRef.current = instance
            }}
          />
          {(applyError || applyMessage) && (
            <p className={`shrink-0 text-xs ${applyError ? 'text-danger' : 'text-success'}`} role="status">
              {applyError ?? applyMessage}
            </p>
          )}
        </div>
        {!readOnly && (
          <div className="flex shrink-0 justify-end gap-2 border-t border-border-subtle px-4 py-3">
            <Button variant="ghost" disabled={busy || loading || !text} onClick={() => void runApply(true)}>
              Dry-run
            </Button>
            <Button variant="primary" disabled={busy || loading || !text} onClick={() => setConfirmApply(true)}>
              Apply
            </Button>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={confirmApply}
        title="Apply this YAML?"
        message="This overwrites the live object in the cluster (or creates it if it does not exist)."
        confirmLabel="Apply"
        danger={false}
        busy={busy}
        onConfirm={() => void runApply(false)}
        onCancel={() => setConfirmApply(false)}
      />
    </div>
  )
}
