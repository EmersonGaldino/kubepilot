import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'

import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { Drawer } from '@/components/ui/Drawer'
import { DescribeModal } from '@/components/common/DescribeModal'
import { WorkloadStatusBadge } from '@/components/common/StatusBadge'
import { Skeleton } from '@/components/common/Skeleton'
import { useResourceActions } from '@/hooks/useResourceActions'
import { toLabelSelector } from '@/lib/k8sSelectors'
import type { LogsPageGroupTarget } from '@/pages/Logs'
import { useDaemonSetStore } from '@/stores/useDaemonSetStore'
import { useNamespaceStore } from '@/stores/useNamespaceStore'
import type { DaemonSetDetail } from '@shared/types'

export function DaemonSetDetailsDrawer({
  daemonSet,
  loading,
  onClose,
}: {
  daemonSet: DaemonSetDetail | null
  loading: boolean
  onClose: () => void
}) {
  const navigate = useNavigate()
  const namespaceFilter = useNamespaceStore((s) => s.selected)
  const loadDaemonSets = useDaemonSetStore((s) => s.loadDaemonSets)
  const loadDaemonSetDetail = useDaemonSetStore((s) => s.loadDaemonSetDetail)

  const refreshAfterMutation = () => {
    void loadDaemonSets(namespaceFilter)
    if (daemonSet) void loadDaemonSetDetail(daemonSet.namespace, daemonSet.name)
  }

  const actions = useResourceActions(refreshAfterMutation)

  if (!daemonSet && !loading) return null

  const openLogs = () => {
    if (!daemonSet) return
    const labelSelector = toLabelSelector(daemonSet.selector)
    if (!labelSelector) return
    const target: LogsPageGroupTarget = { namespace: daemonSet.namespace, labelSelector, groupName: daemonSet.name }
    navigate('/logs', { state: target })
  }

  const doRestart = () => {
    if (!daemonSet) return
    void actions.restart('daemonset', daemonSet.namespace, daemonSet.name)
  }

  const doDelete = () => {
    if (!daemonSet) return
    actions.requestDelete('daemonset', daemonSet.namespace, daemonSet.name)
  }

  const doDescribe = () => {
    if (!daemonSet) return
    void actions.describe('daemonset', daemonSet.namespace, daemonSet.name)
  }

  const handleDeleteConfirmed = async () => {
    if (await actions.confirmDelete()) onClose()
  }

  return (
    <>
    <Drawer title="DaemonSet Details" onClose={onClose}>

        {loading || !daemonSet ? (
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-4 w-full" />
            ))}
          </div>
        ) : (
          <div className="space-y-5">
            <div>
              <p className="text-base font-medium text-fg">{daemonSet.name}</p>
              <p className="text-xs text-fg-muted">{daemonSet.namespace}</p>
            </div>

            <dl className="grid grid-cols-2 gap-3 text-sm">
              <Field label="Status">
                <WorkloadStatusBadge status={daemonSet.status} />
              </Field>
              <Field label="Ready">{daemonSet.ready}</Field>
              <Field label="Desired">{daemonSet.desiredScheduled}</Field>
              <Field label="Updated">{daemonSet.updatedScheduled}</Field>
              <Field label="Available">{daemonSet.availableScheduled}</Field>
              <Field label="Age">{daemonSet.age ?? '—'}</Field>
              <Field label="Created">{daemonSet.createdAt ? new Date(daemonSet.createdAt).toLocaleString() : '—'}</Field>
            </dl>

            <div>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-fg-subtle">Containers</h3>
              <div className="space-y-2">
                {daemonSet.containers.map((container) => (
                  <div key={container.name} className="rounded-md border border-border-subtle bg-white/[0.02] px-3 py-2 text-sm">
                    <span className="font-medium text-fg">{container.name}</span>
                    <p className="mt-0.5 truncate text-xs text-fg-muted" title={container.image}>
                      {container.image}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {daemonSet.conditions.length > 0 && (
              <div>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-fg-subtle">Conditions</h3>
                <div className="space-y-2">
                  {daemonSet.conditions.map((condition) => (
                    <div key={condition.type} className="rounded-md border border-border-subtle bg-white/[0.02] px-3 py-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-fg">{condition.type}</span>
                        <span className={condition.status === 'True' ? 'text-xs text-emerald-400' : 'text-xs text-amber-400'}>
                          {condition.status}
                        </span>
                      </div>
                      {condition.message && <p className="mt-0.5 text-xs text-fg-muted">{condition.message}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {Object.keys(daemonSet.selector).length > 0 && (
              <div>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-fg-subtle">Selector</h3>
                <div className="flex flex-wrap gap-1.5">
                  {Object.entries(daemonSet.selector).map(([key, value]) => (
                    <span key={key} className="rounded bg-white/[0.05] px-1.5 py-0.5 text-[11px] text-fg-muted">
                      {key}={value}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {Object.keys(daemonSet.labels).length > 0 && (
              <div>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-fg-subtle">Labels</h3>
                <div className="flex flex-wrap gap-1.5">
                  {Object.entries(daemonSet.labels).map(([key, value]) => (
                    <span key={key} className="rounded bg-white/[0.05] px-1.5 py-0.5 text-[11px] text-fg-muted">
                      {key}={value}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {actions.actionError && <p className="text-xs text-red-400">{actions.actionError}</p>}

            <div className="flex flex-wrap items-center gap-2 border-t border-border-subtle pt-4">
              <button
                onClick={openLogs}
                disabled={Object.keys(daemonSet.selector).length === 0}
                title={Object.keys(daemonSet.selector).length === 0 ? 'This DaemonSet has no pod selector' : undefined}
                className="rounded-md bg-blue-500/15 px-3 py-1.5 text-xs font-medium text-blue-300 transition hover:bg-blue-500/25 disabled:cursor-not-allowed disabled:bg-white/[0.04] disabled:text-fg-subtle"
              >
                Logs
              </button>

              <button
                onClick={doRestart}
                disabled={actions.busy}
                className="rounded-md bg-white/[0.06] px-3 py-1.5 text-xs font-medium text-fg-muted transition hover:bg-white/[0.1] disabled:cursor-not-allowed disabled:opacity-50"
              >
                Restart
              </button>
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
      title={`${daemonSet?.name ?? ''} · YAML`}
      yaml={actions.describeYaml}
      loading={actions.describeLoading}
      error={actions.describeError}
      onClose={actions.closeDescribe}
    />
    <ConfirmDialog
      open={actions.confirmOpen}
      title={`Delete ${daemonSet?.name}?`}
      message="This deletes the DaemonSet and its pods on every matched node. This cannot be undone."
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
