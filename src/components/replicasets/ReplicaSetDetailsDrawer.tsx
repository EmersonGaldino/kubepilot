import type { ReactNode } from 'react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { Drawer } from '@/components/ui/Drawer'
import { DescribeModal } from '@/components/common/DescribeModal'
import { WorkloadStatusBadge } from '@/components/common/StatusBadge'
import { Skeleton } from '@/components/common/Skeleton'
import { useResourceActions } from '@/hooks/useResourceActions'
import { toLabelSelector } from '@/lib/k8sSelectors'
import type { LogsPageGroupTarget } from '@/pages/Logs'
import { useNamespaceStore } from '@/stores/useNamespaceStore'
import { useReplicaSetStore } from '@/stores/useReplicaSetStore'
import type { ReplicaSetDetail } from '@shared/types'

export function ReplicaSetDetailsDrawer({
  replicaSet,
  loading,
  onClose,
}: {
  replicaSet: ReplicaSetDetail | null
  loading: boolean
  onClose: () => void
}) {
  const navigate = useNavigate()
  const namespaceFilter = useNamespaceStore((s) => s.selected)
  const loadReplicaSets = useReplicaSetStore((s) => s.loadReplicaSets)
  const loadReplicaSetDetail = useReplicaSetStore((s) => s.loadReplicaSetDetail)

  const [replicasInput, setReplicasInput] = useState('')

  const refreshAfterMutation = () => {
    void loadReplicaSets(namespaceFilter)
    if (replicaSet) void loadReplicaSetDetail(replicaSet.namespace, replicaSet.name)
  }

  const actions = useResourceActions(refreshAfterMutation)

  if (!replicaSet && !loading) return null

  const openLogs = () => {
    if (!replicaSet) return
    const labelSelector = toLabelSelector(replicaSet.selector)
    if (!labelSelector) return
    const target: LogsPageGroupTarget = { namespace: replicaSet.namespace, labelSelector, groupName: replicaSet.name }
    navigate('/logs', { state: target })
  }

  const doScale = () => {
    if (!replicaSet) return
    const replicas = Number(replicasInput)
    if (!Number.isInteger(replicas) || replicas < 0) return
    void actions.scale('replicaset', replicaSet.namespace, replicaSet.name, replicas)
  }

  const doDelete = () => {
    if (!replicaSet) return
    actions.requestDelete('replicaset', replicaSet.namespace, replicaSet.name)
  }

  const doDescribe = () => {
    if (!replicaSet) return
    void actions.describe('replicaset', replicaSet.namespace, replicaSet.name)
  }

  const handleDeleteConfirmed = async () => {
    if (await actions.confirmDelete()) onClose()
  }

  return (
    <>
    <Drawer title="ReplicaSet Details" onClose={onClose}>

        {loading || !replicaSet ? (
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-4 w-full" />
            ))}
          </div>
        ) : (
          <div className="space-y-5">
            <div>
              <p className="text-base font-medium text-fg">{replicaSet.name}</p>
              <p className="text-xs text-fg-muted">{replicaSet.namespace}</p>
            </div>

            <dl className="grid grid-cols-2 gap-3 text-sm">
              <Field label="Status">
                <WorkloadStatusBadge status={replicaSet.status} />
              </Field>
              <Field label="Ready">{replicaSet.ready}</Field>
              <Field label="Desired">{replicaSet.desiredReplicas}</Field>
              <Field label="Available">{replicaSet.availableReplicas}</Field>
              <Field label="Owner Kind">{replicaSet.ownerKind ?? '—'}</Field>
              <Field label="Owner Name">{replicaSet.ownerName ?? '—'}</Field>
              <Field label="Age">{replicaSet.age ?? '—'}</Field>
              <Field label="Created">{replicaSet.createdAt ? new Date(replicaSet.createdAt).toLocaleString() : '—'}</Field>
            </dl>

            <div>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-fg-subtle">Containers</h3>
              <div className="space-y-2">
                {replicaSet.containers.map((container) => (
                  <div key={container.name} className="rounded-md border border-border-subtle bg-white/[0.02] px-3 py-2 text-sm">
                    <span className="font-medium text-fg">{container.name}</span>
                    <p className="mt-0.5 truncate text-xs text-fg-muted" title={container.image}>
                      {container.image}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {Object.keys(replicaSet.selector).length > 0 && (
              <div>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-fg-subtle">Selector</h3>
                <div className="flex flex-wrap gap-1.5">
                  {Object.entries(replicaSet.selector).map(([key, value]) => (
                    <span key={key} className="rounded bg-white/[0.05] px-1.5 py-0.5 text-[11px] text-fg-muted">
                      {key}={value}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {Object.keys(replicaSet.labels).length > 0 && (
              <div>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-fg-subtle">Labels</h3>
                <div className="flex flex-wrap gap-1.5">
                  {Object.entries(replicaSet.labels).map(([key, value]) => (
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
                disabled={Object.keys(replicaSet.selector).length === 0}
                title={Object.keys(replicaSet.selector).length === 0 ? 'This ReplicaSet has no pod selector' : undefined}
                className="rounded-md bg-blue-500/15 px-3 py-1.5 text-xs font-medium text-blue-300 transition hover:bg-blue-500/25 disabled:cursor-not-allowed disabled:bg-white/[0.04] disabled:text-fg-subtle"
              >
                Logs
              </button>

              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min={0}
                  placeholder={String(replicaSet.desiredReplicas)}
                  value={replicasInput}
                  onChange={(e) => setReplicasInput(e.target.value)}
                  className="w-16 rounded-md border border-border-subtle bg-surface-2 px-2 py-1.5 text-xs text-fg"
                />
                <button
                  onClick={doScale}
                  disabled={actions.busy || replicasInput === ''}
                  className="rounded-md bg-white/[0.06] px-3 py-1.5 text-xs font-medium text-fg-muted transition hover:bg-white/[0.1] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Scale
                </button>
              </div>

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
      title={`${replicaSet?.name ?? ''} · YAML`}
      yaml={actions.describeYaml}
      loading={actions.describeLoading}
      error={actions.describeError}
      onClose={actions.closeDescribe}
    />
    <ConfirmDialog
      open={actions.confirmOpen}
      title={`Delete ${replicaSet?.name}?`}
      message="This deletes the ReplicaSet and its pods. This cannot be undone."
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
