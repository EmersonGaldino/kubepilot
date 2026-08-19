import type { ReactNode } from 'react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { Drawer } from '@/components/ui/Drawer'
import { DescribeModal } from '@/components/common/DescribeModal'
import { PodPhaseBadge } from '@/components/common/StatusBadge'
import { Skeleton } from '@/components/common/Skeleton'
import { ExecConsole } from '@/components/pods/ExecConsole'
import { useResourceActions } from '@/hooks/useResourceActions'
import type { LogsPageTarget } from '@/pages/Logs'
import { useNamespaceStore } from '@/stores/useNamespaceStore'
import { usePodStore } from '@/stores/usePodStore'
import type { PodDetail } from '@shared/types'

export function PodDetailsDrawer({
  pod,
  loading,
  onClose,
}: {
  pod: PodDetail | null
  loading: boolean
  onClose: () => void
}) {
  const navigate = useNavigate()
  const namespaceFilter = useNamespaceStore((s) => s.selected)
  const loadPods = usePodStore((s) => s.loadPods)
  const loadPodDetail = usePodStore((s) => s.loadPodDetail)

  const [execOpen, setExecOpen] = useState(false)
  const [execContainer, setExecContainer] = useState<string | undefined>(undefined)

  const refreshAfterMutation = () => {
    void loadPods(namespaceFilter)
    if (pod) void loadPodDetail(pod.namespace, pod.name)
  }

  const actions = useResourceActions(refreshAfterMutation)

  if (!pod && !loading) return null

  const openLogs = () => {
    if (!pod) return
    const target: LogsPageTarget = { namespace: pod.namespace, podName: pod.name, containerName: pod.containers[0]?.name }
    navigate('/logs', { state: target })
  }

  const openExec = () => {
    if (!pod) return
    if (pod.containers.length > 1) {
      setExecContainer(execContainer ?? pod.containers[0]?.name)
    }
    setExecOpen(true)
  }

  const doDescribe = () => {
    if (!pod) return
    void actions.describe('pod', pod.namespace, pod.name)
  }

  const doDelete = () => {
    if (!pod) return
    actions.requestDelete('pod', pod.namespace, pod.name)
  }

  const handleDeleteConfirmed = async () => {
    if (await actions.confirmDelete()) onClose()
  }

  return (
    <>
    <Drawer title="Pod Details" onClose={onClose}>

        {loading || !pod ? (
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-4 w-full" />
            ))}
          </div>
        ) : (
          <div className="space-y-5">
            <div>
              <p className="text-base font-medium text-fg">{pod.name}</p>
              <p className="text-xs text-fg-muted">{pod.namespace}</p>
            </div>

            <dl className="grid grid-cols-2 gap-3 text-sm">
              <Field label="Status">
                <PodPhaseBadge phase={pod.phase} />
              </Field>
              <Field label="Ready">{pod.ready}</Field>
              <Field label="Restarts">{pod.restarts}</Field>
              <Field label="Node">{pod.node ?? '—'}</Field>
              <Field label="Pod IP">{pod.podIP ?? '—'}</Field>
              <Field label="Age">{pod.age ?? '—'}</Field>
              <Field label="Owner">{pod.ownerKind ? `${pod.ownerKind}/${pod.ownerName}` : '—'}</Field>
              <Field label="Created">{pod.createdAt ? new Date(pod.createdAt).toLocaleString() : '—'}</Field>
            </dl>

            <div>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-fg-subtle">Containers</h3>
              <div className="space-y-2">
                {pod.containers.map((container) => (
                  <div key={container.name} className="rounded-md border border-border-subtle bg-white/[0.02] px-3 py-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-fg">{container.name}</span>
                      <span className={container.ready ? 'text-xs text-emerald-400' : 'text-xs text-amber-400'}>
                        {container.state}
                      </span>
                    </div>
                    <p className="mt-0.5 truncate text-xs text-fg-muted" title={container.image}>
                      {container.image}
                    </p>
                    {container.restartCount > 0 && (
                      <p className="mt-0.5 text-xs text-fg-subtle">{container.restartCount} restarts</p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {Object.keys(pod.labels).length > 0 && (
              <div>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-fg-subtle">Labels</h3>
                <div className="flex flex-wrap gap-1.5">
                  {Object.entries(pod.labels).map(([key, value]) => (
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
                className="rounded-md bg-blue-500/15 px-3 py-1.5 text-xs font-medium text-blue-300 transition hover:bg-blue-500/25"
              >
                Logs
              </button>

              {pod.containers.length > 1 && (
                <select
                  value={execContainer ?? pod.containers[0]?.name}
                  onChange={(e) => setExecContainer(e.target.value)}
                  className="rounded-md border border-border-subtle bg-surface-2 px-2 py-1.5 text-xs text-fg"
                >
                  {pod.containers.map((container) => (
                    <option key={container.name} value={container.name}>
                      {container.name}
                    </option>
                  ))}
                </select>
              )}
              <button
                onClick={openExec}
                className="rounded-md bg-white/[0.06] px-3 py-1.5 text-xs font-medium text-fg-muted transition hover:bg-white/[0.1]"
              >
                Exec
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
      title={`${pod?.name ?? ''} · YAML`}
      yaml={actions.describeYaml}
      loading={actions.describeLoading}
      error={actions.describeError}
      onClose={actions.closeDescribe}
    />
    <ConfirmDialog
      open={actions.confirmOpen}
      title={`Delete ${pod?.name}?`}
      message="This deletes the Pod. If it's managed by a controller, a replacement will be created automatically."
      busy={actions.busy}
      onConfirm={() => void handleDeleteConfirmed()}
      onCancel={actions.cancelDelete}
    />
    {execOpen && pod && (
      <ExecConsole
        namespace={pod.namespace}
        podName={pod.name}
        containerName={execContainer ?? pod.containers[0]?.name}
        onClose={() => setExecOpen(false)}
      />
    )}
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
