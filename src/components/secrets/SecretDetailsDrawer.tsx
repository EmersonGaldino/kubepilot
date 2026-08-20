import type { ReactNode } from 'react'
import { useState } from 'react'

import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { Drawer } from '@/components/ui/Drawer'
import { DescribeModal } from '@/components/common/DescribeModal'
import { Skeleton } from '@/components/common/Skeleton'
import { useResourceActions } from '@/hooks/useResourceActions'
import { useNamespaceStore } from '@/stores/useNamespaceStore'
import { useSecretStore } from '@/stores/useSecretStore'
import type { SecretDetail } from '@shared/types'

const MASK = '••••••••'

/** Renders one Secret data entry with its value masked by default and a
 * per-row "Reveal"/"Hide" toggle — purely a shoulder-surf/screenshot guard,
 * not real security, since the decoded value already sits in renderer
 * memory the moment the drawer loads it. */
function SecretDataRow({ entryKey, value }: { entryKey: string; value: string }) {
  const [revealed, setRevealed] = useState(false)

  return (
    <div className="rounded-md border border-border-subtle bg-white/[0.02] px-3 py-2 text-sm">
      <div className="flex items-center justify-between gap-2">
        <span className="font-medium text-fg">{entryKey}</span>
        <button
          onClick={() => setRevealed((r) => !r)}
          className="shrink-0 rounded-md bg-white/[0.06] px-2 py-0.5 text-[11px] font-medium text-fg-muted transition hover:bg-white/[0.1]"
        >
          {revealed ? 'Hide' : 'Reveal'}
        </button>
      </div>
      <pre className="mt-1 max-h-40 overflow-auto whitespace-pre-wrap break-all font-mono text-xs leading-relaxed text-fg-muted">
        {revealed ? value : MASK}
      </pre>
    </div>
  )
}

export function SecretDetailsDrawer({
  secret,
  loading,
  onClose,
}: {
  secret: SecretDetail | null
  loading: boolean
  onClose: () => void
}) {
  const namespaceFilter = useNamespaceStore((s) => s.selected)
  const loadSecrets = useSecretStore((s) => s.loadSecrets)
  const loadSecretDetail = useSecretStore((s) => s.loadSecretDetail)

  const refreshAfterMutation = () => {
    void loadSecrets(namespaceFilter)
    if (secret) void loadSecretDetail(secret.namespace, secret.name)
  }

  const actions = useResourceActions(refreshAfterMutation)

  if (!secret && !loading) return null

  const doDelete = () => {
    if (!secret) return
    actions.requestDelete('secret', secret.namespace, secret.name)
  }

  const doDescribe = () => {
    if (!secret) return
    void actions.describe('secret', secret.namespace, secret.name)
  }

  const handleDeleteConfirmed = async () => {
    if (await actions.confirmDelete()) onClose()
  }

  return (
    <>
    <Drawer title="Secret Details" onClose={onClose}>

        {loading || !secret ? (
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-4 w-full" />
            ))}
          </div>
        ) : (
          <div className="space-y-5">
            <div>
              <p className="text-base font-medium text-fg">{secret.name}</p>
              <p className="text-xs text-fg-muted">{secret.namespace}</p>
            </div>

            <dl className="grid grid-cols-2 gap-3 text-sm">
              <Field label="Type">{secret.type}</Field>
              <Field label="Keys">{secret.keyCount}</Field>
              <Field label="Age">{secret.age ?? '—'}</Field>
              <Field label="Created">{secret.createdAt ? new Date(secret.createdAt).toLocaleString() : '—'}</Field>
            </dl>

            {Object.keys(secret.labels).length > 0 && (
              <div>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-fg-subtle">Labels</h3>
                <div className="flex flex-wrap gap-1.5">
                  {Object.entries(secret.labels).map(([key, value]) => (
                    <span key={key} className="rounded bg-white/[0.05] px-1.5 py-0.5 text-[11px] text-fg-muted">
                      {key}={value}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-fg-subtle">Data</h3>
              {secret.data.length === 0 ? (
                <p className="text-xs text-fg-subtle">No data.</p>
              ) : (
                <div className="max-h-80 space-y-2 overflow-y-auto">
                  {secret.data.map((entry) => (
                    <SecretDataRow key={entry.key} entryKey={entry.key} value={entry.value} />
                  ))}
                </div>
              )}
            </div>

            {actions.actionError && <p className="text-xs text-red-400">{actions.actionError}</p>}

            <div className="flex flex-wrap items-center gap-2 border-t border-border-subtle pt-4">
              <button
                onClick={doDescribe}
                className="rounded-md bg-white/[0.06] px-3 py-1.5 text-xs font-medium text-fg-muted transition hover:bg-white/[0.1]"
              >
                Describe
              </button>
              <button
                onClick={doDelete}
                disabled={actions.busy}
                className="rounded-md bg-red-500/15 px-3 py-1.5 text-xs font-medium text-red-300 transition hover:bg-red-500/25 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Delete
              </button>
            </div>
          </div>
        )}
    </Drawer>

    <DescribeModal
      open={actions.describeOpen}
      title={`${secret?.name ?? ''} · YAML`}
      yaml={actions.describeYaml}
      loading={actions.describeLoading}
      error={actions.describeError}
      onClose={actions.closeDescribe}
      onApplied={refreshAfterMutation}
      secretWarning
    />
    <ConfirmDialog
      open={actions.confirmOpen}
      title={`Delete ${secret?.name}?`}
      message="This deletes the Secret. Any pods currently mounting it are unaffected until restarted. This cannot be undone."
      busy={actions.busy}
      onConfirm={() => void handleDeleteConfirmed()}
      onCancel={actions.cancelDelete}
    />
    </>
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
