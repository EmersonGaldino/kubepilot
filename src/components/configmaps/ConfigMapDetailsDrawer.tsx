import type { ReactNode } from 'react'

import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { Drawer } from '@/components/ui/Drawer'
import { DescribeModal } from '@/components/common/DescribeModal'
import { Skeleton } from '@/components/common/Skeleton'
import { useResourceActions } from '@/hooks/useResourceActions'
import { useConfigMapStore } from '@/stores/useConfigMapStore'
import { useNamespaceStore } from '@/stores/useNamespaceStore'
import type { ConfigMapDetail } from '@shared/types'

export function ConfigMapDetailsDrawer({
  configMap,
  loading,
  onClose,
}: {
  configMap: ConfigMapDetail | null
  loading: boolean
  onClose: () => void
}) {
  const namespaceFilter = useNamespaceStore((s) => s.selected)
  const loadConfigMaps = useConfigMapStore((s) => s.loadConfigMaps)
  const loadConfigMapDetail = useConfigMapStore((s) => s.loadConfigMapDetail)

  const refreshAfterMutation = () => {
    void loadConfigMaps(namespaceFilter)
    if (configMap) void loadConfigMapDetail(configMap.namespace, configMap.name)
  }

  const actions = useResourceActions(refreshAfterMutation)

  if (!configMap && !loading) return null

  const doDelete = () => {
    if (!configMap) return
    actions.requestDelete('configmap', configMap.namespace, configMap.name)
  }

  const doDescribe = () => {
    if (!configMap) return
    void actions.describe('configmap', configMap.namespace, configMap.name)
  }

  const handleDeleteConfirmed = async () => {
    if (await actions.confirmDelete()) onClose()
  }

  return (
    <>
    <Drawer title="ConfigMap Details" onClose={onClose}>

        {loading || !configMap ? (
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-4 w-full" />
            ))}
          </div>
        ) : (
          <div className="space-y-5">
            <div>
              <p className="text-base font-medium text-fg">{configMap.name}</p>
              <p className="text-xs text-fg-muted">{configMap.namespace}</p>
            </div>

            <dl className="grid grid-cols-2 gap-3 text-sm">
              <Field label="Keys">{configMap.keyCount}</Field>
              <Field label="Age">{configMap.age ?? '—'}</Field>
              <Field label="Created">{configMap.createdAt ? new Date(configMap.createdAt).toLocaleString() : '—'}</Field>
            </dl>

            {Object.keys(configMap.labels).length > 0 && (
              <div>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-fg-subtle">Labels</h3>
                <div className="flex flex-wrap gap-1.5">
                  {Object.entries(configMap.labels).map(([key, value]) => (
                    <span key={key} className="rounded bg-white/[0.05] px-1.5 py-0.5 text-[11px] text-fg-muted">
                      {key}={value}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-fg-subtle">Data</h3>
              {configMap.data.length === 0 ? (
                <p className="text-xs text-fg-subtle">No data.</p>
              ) : (
                <div className="max-h-80 space-y-2 overflow-y-auto">
                  {configMap.data.map((entry) => (
                    <div key={entry.key} className="rounded-md border border-border-subtle bg-white/[0.02] px-3 py-2 text-sm">
                      <span className="font-medium text-fg">{entry.key}</span>
                      <pre className="mt-1 max-h-40 overflow-auto whitespace-pre-wrap break-all font-mono text-xs leading-relaxed text-fg-muted">
                        {entry.value}
                      </pre>
                    </div>
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
      title={`${configMap?.name ?? ''} · YAML`}
      yaml={actions.describeYaml}
      loading={actions.describeLoading}
      error={actions.describeError}
      onClose={actions.closeDescribe}
      onApplied={refreshAfterMutation}
    />
    <ConfirmDialog
      open={actions.confirmOpen}
      title={`Delete ${configMap?.name}?`}
      message="This deletes the ConfigMap. Any pods currently mounting it are unaffected until restarted. This cannot be undone."
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
