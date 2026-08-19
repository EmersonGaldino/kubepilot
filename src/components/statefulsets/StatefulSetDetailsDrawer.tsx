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
import { useStatefulSetStore } from '@/stores/useStatefulSetStore'
import type { StatefulSetDetail } from '@shared/types'

export function StatefulSetDetailsDrawer({
  statefulSet,
  loading,
  onClose,
}: {
  statefulSet: StatefulSetDetail | null
  loading: boolean
  onClose: () => void
}) {
  const navigate = useNavigate()
  const namespaceFilter = useNamespaceStore((s) => s.selected)
  const loadStatefulSets = useStatefulSetStore((s) => s.loadStatefulSets)
  const loadStatefulSetDetail = useStatefulSetStore((s) => s.loadStatefulSetDetail)

  const [replicasInput, setReplicasInput] = useState('')

  const refreshAfterMutation = () => {
    void loadStatefulSets(namespaceFilter)
    if (statefulSet) void loadStatefulSetDetail(statefulSet.namespace, statefulSet.name)
  }

  const actions = useResourceActions(refreshAfterMutation)

  if (!statefulSet && !loading) return null

  const openLogs = () => {
    if (!statefulSet) return
    const labelSelector = toLabelSelector(statefulSet.selector)
    if (!labelSelector) return
    const target: LogsPageGroupTarget = { namespace: statefulSet.namespace, labelSelector, groupName: statefulSet.name }
    navigate('/logs', { state: target })
  }

  const doScale = () => {
    if (!statefulSet) return
    const replicas = Number(replicasInput)
    if (!Number.isInteger(replicas) || replicas < 0) return
    void actions.scale('statefulset', statefulSet.namespace, statefulSet.name, replicas)
  }

  const doRestart = () => {
    if (!statefulSet) return
    void actions.restart('statefulset', statefulSet.namespace, statefulSet.name)
  }

  const doDelete = () => {
    if (!statefulSet) return
    actions.requestDelete('statefulset', statefulSet.namespace, statefulSet.name)
  }

  const doDescribe = () => {
    if (!statefulSet) return
    void actions.describe('statefulset', statefulSet.namespace, statefulSet.name)
  }

  const handleDeleteConfirmed = async () => {
    if (await actions.confirmDelete()) onClose()
  }

  return (
    <>
    <Drawer title="StatefulSet Details" onClose={onClose}>

        {loading || !statefulSet ? (
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-4 w-full" />
            ))}
          </div>
        ) : (
          <div className="space-y-5">
            <div>
              <p className="text-base font-medium text-fg">{statefulSet.name}</p>
              <p className="text-xs text-fg-muted">{statefulSet.namespace}</p>
            </div>

            <dl className="grid grid-cols-2 gap-3 text-sm">
              <Field label="Status">
                <WorkloadStatusBadge status={statefulSet.status} />
              </Field>
              <Field label="Ready">{statefulSet.ready}</Field>
              <Field label="Desired">{statefulSet.desiredReplicas}</Field>
              <Field label="Updated">{statefulSet.updatedReplicas}</Field>
              <Field label="Available">{statefulSet.availableReplicas}</Field>
              <Field label="Service Name">{statefulSet.serviceName ?? '—'}</Field>
              <Field label="Age">{statefulSet.age ?? '—'}</Field>
              <Field label="Created">{statefulSet.createdAt ? new Date(statefulSet.createdAt).toLocaleString() : '—'}</Field>
            </dl>

            <div>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-fg-subtle">Containers</h3>
              <div className="space-y-2">
                {statefulSet.containers.map((container) => (
                  <div key={container.name} className="rounded-md border border-border-subtle bg-white/[0.02] px-3 py-2 text-sm">
                    <span className="font-medium text-fg">{container.name}</span>
                    <p className="mt-0.5 truncate text-xs text-fg-muted" title={container.image}>
                      {container.image}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {statefulSet.conditions.length > 0 && (
              <div>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-fg-subtle">Conditions</h3>
                <div className="space-y-2">
                  {statefulSet.conditions.map((condition) => (
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

            {Object.keys(statefulSet.selector).length > 0 && (
              <div>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-fg-subtle">Selector</h3>
                <div className="flex flex-wrap gap-1.5">
                  {Object.entries(statefulSet.selector).map(([key, value]) => (
                    <span key={key} className="rounded bg-white/[0.05] px-1.5 py-0.5 text-[11px] text-fg-muted">
                      {key}={value}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {Object.keys(statefulSet.labels).length > 0 && (
              <div>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-fg-subtle">Labels</h3>
                <div className="flex flex-wrap gap-1.5">
                  {Object.entries(statefulSet.labels).map(([key, value]) => (
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
                disabled={Object.keys(statefulSet.selector).length === 0}
                title={Object.keys(statefulSet.selector).length === 0 ? 'This StatefulSet has no pod selector' : undefined}
                className="rounded-md bg-blue-500/15 px-3 py-1.5 text-xs font-medium text-blue-300 transition hover:bg-blue-500/25 disabled:cursor-not-allowed disabled:bg-white/[0.04] disabled:text-fg-subtle"
              >
                Logs
              </button>

              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min={0}
                  placeholder={String(statefulSet.desiredReplicas)}
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
      title={`${statefulSet?.name ?? ''} · YAML`}
      yaml={actions.describeYaml}
      loading={actions.describeLoading}
      error={actions.describeError}
      onClose={actions.closeDescribe}
    />
    <ConfirmDialog
      open={actions.confirmOpen}
      title={`Delete ${statefulSet?.name}?`}
      message="This deletes the StatefulSet and its pods. Persistent volumes are not removed. This cannot be undone."
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
