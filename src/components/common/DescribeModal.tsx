import { AlignLeft, Copy, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import type { editor } from 'monaco-editor'

import { Button } from '@/components/ui/Button'
import { IconButton } from '@/components/ui/IconButton'
import { useFocusTrap } from '@/hooks/useFocusTrap'
import { kubernetesApi } from '@/services/kubernetesApi'
import { useClusterPrefsStore } from '@/stores/useClusterPrefsStore'
import { useClusterStore } from '@/stores/useClusterStore'
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
  const [forceOwnership, setForceOwnership] = useState(false)
  const [validatedDraft, setValidatedDraft] = useState<string | null>(null)
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null)
  const dialogRef = useRef<HTMLDivElement>(null)
  const currentContext = useClusterStore((state) => state.currentContext)
  const clusterProfile = useClusterPrefsStore((state) => (currentContext ? state.profiles[currentContext] : undefined))

  useFocusTrap(dialogRef, open && !confirmApply)

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
    setForceOwnership(false)
    setValidatedDraft(null)
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

  const resourceName = yaml?.match(/^metadata:\s*\n(?:.*\n)*?\s+name:\s*([^\s#]+)/m)?.[1] ?? title.split(' · ')[0]
  const production = clusterProfile === 'production'
  const needsDryRun = validatedDraft !== text

  const runApply = async (dryRun: boolean) => {
    setBusy(true)
    setApplyError(null)
    setApplyMessage(null)
    try {
      const result: ApplyResult = await kubernetesApi.apply.run({ yaml: text, dryRun, force: forceOwnership })
      const action = result.created ? 'created' : 'applied'
      setApplyMessage(
        dryRun
          ? `Dry-run OK — would ${action} ${result.kind}/${result.name}`
          : `${result.kind}/${result.name} ${action}`,
      )
      if (dryRun) setValidatedDraft(text)
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
        ref={dialogRef}
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
            onChange={(value) => {
              setDraft(value)
              if (value !== validatedDraft) setValidatedDraft(null)
            }}
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
          {!readOnly && needsDryRun && text && !loading && (
            <p className="shrink-0 text-xs text-warning">Run dry-run after every YAML change before applying it.</p>
          )}
        </div>
        {!readOnly && (
          <div className="flex shrink-0 items-center justify-between gap-4 border-t border-border-subtle px-4 py-3">
            <label className="flex items-center gap-2 text-xs text-fg-muted">
              <input
                type="checkbox"
                checked={forceOwnership}
                disabled={busy || loading}
                onChange={(event) => setForceOwnership(event.target.checked)}
              />
              Force ownership conflicts
            </label>
            <div className="flex gap-2">
              <Button variant="ghost" disabled={busy || loading || !text} onClick={() => void runApply(true)}>
                Dry-run
              </Button>
              <Button variant="primary" disabled={busy || loading || !text || needsDryRun} onClick={() => setConfirmApply(true)}>
                Apply
              </Button>
            </div>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={confirmApply}
        title="Apply this YAML?"
        message={
          forceOwnership
            ? 'This overwrites the live object and takes ownership of conflicting fields managed by another controller.'
            : 'This applies the YAML to the live object (or creates it if it does not exist). Ownership conflicts are rejected.'
        }
        confirmLabel="Apply"
        danger={false}
        busy={busy}
        confirmationText={production ? resourceName : undefined}
        onConfirm={() => void runApply(false)}
        onCancel={() => setConfirmApply(false)}
      />
    </div>
  )
}
