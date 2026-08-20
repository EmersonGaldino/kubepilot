import type { ReactNode } from 'react'
import { useState } from 'react'

import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { DescribeModal } from '@/components/common/DescribeModal'
import { Skeleton } from '@/components/common/Skeleton'
import { Button } from '@/components/ui/Button'
import { Drawer } from '@/components/ui/Drawer'
import { useEscapeKey } from '@/hooks/useEscapeKey'
import { useResourceActions } from '@/hooks/useResourceActions'
import { useNamespaceStore } from '@/stores/useNamespaceStore'
import type { NamespaceDetail } from '@shared/types'

export function NamespaceDetailsDrawer({
  namespace,
  loading,
  onClose,
}: {
  namespace: NamespaceDetail | null
  loading: boolean
  onClose: () => void
}) {
  const loadNamespaces = useNamespaceStore((s) => s.loadNamespaces)
  const loadNamespaceDetail = useNamespaceStore((s) => s.loadNamespaceDetail)
  const actions = useResourceActions(() => {
    void loadNamespaces()
    if (namespace) void loadNamespaceDetail(namespace.name)
  })

  if (!namespace && !loading) return null

  const handleDeleteConfirmed = async () => {
    if (await actions.confirmDelete()) onClose()
  }

  return (
    <>
      <Drawer title="Namespace Details" onClose={onClose}>
        {loading || !namespace ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-4 w-full" />
            ))}
          </div>
        ) : (
          <div className="space-y-5">
            <div>
              <p className="text-base font-medium text-fg">{namespace.name}</p>
              <p className="text-xs text-fg-muted">{namespace.status}</p>
            </div>
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <Field label="Age">{namespace.age ?? '—'}</Field>
              <Field label="Created">
                {namespace.createdAt ? new Date(namespace.createdAt).toLocaleString() : '—'}
              </Field>
            </dl>
            {Object.keys(namespace.labels).length > 0 && (
              <ChipSection title="Labels" items={Object.entries(namespace.labels).map(([k, v]) => `${k}=${v}`)} />
            )}
            {Object.keys(namespace.annotations).length > 0 && (
              <ChipSection
                title="Annotations"
                items={Object.entries(namespace.annotations).slice(0, 20).map(([k, v]) => `${k}=${v}`)}
              />
            )}
            {namespace.resourceQuotas.length > 0 && (
              <div>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-fg-subtle">ResourceQuota</h3>
                <ul className="space-y-1 text-xs text-fg-muted">
                  {namespace.resourceQuotas.map((q) => (
                    <li key={q.name}>
                      {q.name}: {q.hard || '—'}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {namespace.limitRanges.length > 0 && (
              <div>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-fg-subtle">LimitRange</h3>
                <ul className="space-y-1 text-xs text-fg-muted">
                  {namespace.limitRanges.map((lr) => (
                    <li key={lr.name}>
                      {lr.name}: {lr.summary || '—'}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {actions.actionError && <p className="text-xs text-red-400">{actions.actionError}</p>}
            <div className="flex flex-wrap items-center gap-2 border-t border-border-subtle pt-4">
              <button
                onClick={() => void actions.describe('namespace', '', namespace.name)}
                className="rounded-md bg-white/[0.06] px-3 py-1.5 text-xs font-medium text-fg-muted transition hover:bg-white/[0.1]"
              >
                Describe
              </button>
              <button
                onClick={() => actions.requestDelete('namespace', '', namespace.name)}
                disabled={actions.busy}
                className="rounded-md bg-red-500/15 px-3 py-1.5 text-xs font-medium text-red-300 transition hover:bg-red-500/25 disabled:opacity-50"
              >
                Delete
              </button>
            </div>
          </div>
        )}
      </Drawer>
      <DescribeModal
        open={actions.describeOpen}
        title={`${namespace?.name ?? ''} · YAML`}
        yaml={actions.describeYaml}
        loading={actions.describeLoading}
        error={actions.describeError}
        onClose={actions.closeDescribe}
        onApplied={() => {
          void loadNamespaces()
          if (namespace) void loadNamespaceDetail(namespace.name)
        }}
      />
      <ConfirmDialog
        open={actions.confirmOpen}
        title={`Delete ${namespace?.name}?`}
        message="This deletes the namespace and everything inside it. This cannot be undone."
        busy={actions.busy}
        onConfirm={() => void handleDeleteConfirmed()}
        onCancel={actions.cancelDelete}
      />
    </>
  )
}

export function CreateNamespaceDialog({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const createNamespace = useNamespaceStore((s) => s.createNamespace)
  const [name, setName] = useState('')
  const [labels, setLabels] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  useEscapeKey(onClose, open, true)

  if (!open) return null

  const submit = async () => {
    setBusy(true)
    setError(null)
    try {
      const parsed: Record<string, string> = {}
      for (const part of labels.split(',').map((s) => s.trim()).filter(Boolean)) {
        const [k, ...rest] = part.split('=')
        if (!k || rest.length === 0) throw new Error('Labels must be key=value, comma-separated')
        parsed[k] = rest.join('=')
      }
      await createNamespace(name.trim(), parsed)
      onClose()
      setName('')
      setLabels('')
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        className="w-full max-w-sm rounded-xl border border-border-subtle bg-surface-1 p-5 shadow-panel"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-sm font-semibold text-fg">Create namespace</h3>
        <label className="mt-3 block text-xs text-fg-subtle">
          Name
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 h-8 w-full rounded-md border border-border-subtle bg-surface-0 px-2 text-sm text-fg"
          />
        </label>
        <label className="mt-3 block text-xs text-fg-subtle">
          Labels (optional, key=value, …)
          <input
            value={labels}
            onChange={(e) => setLabels(e.target.value)}
            className="mt-1 h-8 w-full rounded-md border border-border-subtle bg-surface-0 px-2 text-sm text-fg"
          />
        </label>
        {error && <p className="mt-2 text-xs text-danger">{error}</p>}
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button variant="primary" onClick={() => void submit()} disabled={busy || !name.trim()}>
            Create
          </Button>
        </div>
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <dt className="text-xs text-fg-subtle">{label}</dt>
      <dd className="mt-0.5 text-fg">{children}</dd>
    </div>
  )
}

function ChipSection({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-fg-subtle">{title}</h3>
      <div className="flex flex-wrap gap-1.5">
        {items.map((item) => (
          <span key={item} className="rounded bg-white/[0.05] px-1.5 py-0.5 text-[11px] text-fg-muted">
            {item}
          </span>
        ))}
      </div>
    </div>
  )
}
