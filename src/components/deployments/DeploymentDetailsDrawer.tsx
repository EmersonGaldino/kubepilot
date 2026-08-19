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
import { useDeploymentStore } from '@/stores/useDeploymentStore'
import { useNamespaceStore } from '@/stores/useNamespaceStore'
import type { DeploymentDetail } from '@shared/types'

export function DeploymentDetailsDrawer({
  deployment,
  loading,
  onClose,
}: {
  deployment: DeploymentDetail | null
  loading: boolean
  onClose: () => void
}) {
  const navigate = useNavigate()
  const namespaceFilter = useNamespaceStore((s) => s.selected)
  const loadDeployments = useDeploymentStore((s) => s.loadDeployments)
  const loadDeploymentDetail = useDeploymentStore((s) => s.loadDeploymentDetail)

  const [replicasInput, setReplicasInput] = useState('')

  const refreshAfterMutation = () => {
    void loadDeployments(namespaceFilter)
    if (deployment) void loadDeploymentDetail(deployment.namespace, deployment.name)
  }

  const actions = useResourceActions(refreshAfterMutation)

  if (!deployment && !loading) return null

  const openLogs = () => {
    if (!deployment) return
    const labelSelector = toLabelSelector(deployment.selector)
    if (!labelSelector) return
    const target: LogsPageGroupTarget = { namespace: deployment.namespace, labelSelector, groupName: deployment.name }
    navigate('/logs', { state: target })
  }

  const doScale = () => {
    if (!deployment) return
    const replicas = Number(replicasInput)
    if (!Number.isInteger(replicas) || replicas < 0) return
    void actions.scale('deployment', deployment.namespace, deployment.name, replicas)
  }

  const doRestart = () => {
    if (!deployment) return
    void actions.restart('deployment', deployment.namespace, deployment.name)
  }

  const doDelete = () => {
    if (!deployment) return
    actions.requestDelete('deployment', deployment.namespace, deployment.name)
  }

  const doDescribe = () => {
    if (!deployment) return
    void actions.describe('deployment', deployment.namespace, deployment.name)
  }

  const handleDeleteConfirmed = async () => {
    if (await actions.confirmDelete()) onClose()
  }

  return (
    <>
    <Drawer title="Deployment Details" onClose={onClose}>

        {loading || !deployment ? (
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-4 w-full" />
            ))}
          </div>
        ) : (
          <div className="space-y-5">
            <div>
              <p className="text-base font-medium text-fg">{deployment.name}</p>
              <p className="text-xs text-fg-muted">{deployment.namespace}</p>
            </div>

            <dl className="grid grid-cols-2 gap-3 text-sm">
              <Field label="Status">
                <WorkloadStatusBadge status={deployment.status} />
              </Field>
              <Field label="Ready">{deployment.ready}</Field>
              <Field label="Desired">{deployment.desiredReplicas}</Field>
              <Field label="Updated">{deployment.updatedReplicas}</Field>
              <Field label="Available">{deployment.availableReplicas}</Field>
              <Field label="Strategy">{deployment.strategy}</Field>
              <Field label="Age">{deployment.age ?? '—'}</Field>
              <Field label="Created">{deployment.createdAt ? new Date(deployment.createdAt).toLocaleString() : '—'}</Field>
            </dl>

            <div>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-fg-subtle">Containers</h3>
              <div className="space-y-2">
                {deployment.containers.map((container) => (
                  <div key={container.name} className="rounded-md border border-border-subtle bg-white/[0.02] px-3 py-2 text-sm">
                    <span className="font-medium text-fg">{container.name}</span>
                    <p className="mt-0.5 truncate text-xs text-fg-muted" title={container.image}>
                      {container.image}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {deployment.conditions.length > 0 && (
              <div>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-fg-subtle">Conditions</h3>
                <div className="space-y-2">
                  {deployment.conditions.map((condition) => (
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

            {Object.keys(deployment.selector).length > 0 && (
              <div>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-fg-subtle">Selector</h3>
                <div className="flex flex-wrap gap-1.5">
                  {Object.entries(deployment.selector).map(([key, value]) => (
                    <span key={key} className="rounded bg-white/[0.05] px-1.5 py-0.5 text-[11px] text-fg-muted">
                      {key}={value}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {Object.keys(deployment.labels).length > 0 && (
              <div>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-fg-subtle">Labels</h3>
                <div className="flex flex-wrap gap-1.5">
                  {Object.entries(deployment.labels).map(([key, value]) => (
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
                disabled={Object.keys(deployment.selector).length === 0}
                title={Object.keys(deployment.selector).length === 0 ? 'This Deployment has no pod selector' : undefined}
                className="rounded-md bg-blue-500/15 px-3 py-1.5 text-xs font-medium text-blue-300 transition hover:bg-blue-500/25 disabled:cursor-not-allowed disabled:bg-white/[0.04] disabled:text-fg-subtle"
              >
                Logs
              </button>

              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min={0}
                  placeholder={String(deployment.desiredReplicas)}
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
      title={`${deployment?.name ?? ''} · YAML`}
      yaml={actions.describeYaml}
      loading={actions.describeLoading}
      error={actions.describeError}
      onClose={actions.closeDescribe}
    />
    <ConfirmDialog
      open={actions.confirmOpen}
      title={`Delete ${deployment?.name}?`}
      message="This deletes the Deployment and its ReplicaSet/pods. This cannot be undone."
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
