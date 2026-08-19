import type { ReactNode } from 'react'

import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { Drawer } from '@/components/ui/Drawer'
import { DescribeModal } from '@/components/common/DescribeModal'
import { Skeleton } from '@/components/common/Skeleton'
import { useResourceActions } from '@/hooks/useResourceActions'
import { useCronJobStore } from '@/stores/useCronJobStore'
import { useNamespaceStore } from '@/stores/useNamespaceStore'
import type { CronJobDetail } from '@shared/types'

export function CronJobDetailsDrawer({
  cronJob,
  loading,
  onClose,
}: {
  cronJob: CronJobDetail | null
  loading: boolean
  onClose: () => void
}) {
  const namespaceFilter = useNamespaceStore((s) => s.selected)
  const loadCronJobs = useCronJobStore((s) => s.loadCronJobs)
  const loadCronJobDetail = useCronJobStore((s) => s.loadCronJobDetail)

  const refreshAfterMutation = () => {
    void loadCronJobs(namespaceFilter)
    if (cronJob) void loadCronJobDetail(cronJob.namespace, cronJob.name)
  }

  const actions = useResourceActions(refreshAfterMutation)

  if (!cronJob && !loading) return null

  const doDelete = () => {
    if (!cronJob) return
    actions.requestDelete('cronjob', cronJob.namespace, cronJob.name)
  }

  const doDescribe = () => {
    if (!cronJob) return
    void actions.describe('cronjob', cronJob.namespace, cronJob.name)
  }

  const handleDeleteConfirmed = async () => {
    if (await actions.confirmDelete()) onClose()
  }

  return (
    <>
    <Drawer title="CronJob Details" onClose={onClose}>

        {loading || !cronJob ? (
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-4 w-full" />
            ))}
          </div>
        ) : (
          <div className="space-y-5">
            <div>
              <p className="text-base font-medium text-fg">{cronJob.name}</p>
              <p className="text-xs text-fg-muted">{cronJob.namespace}</p>
            </div>

            <dl className="grid grid-cols-2 gap-3 text-sm">
              <Field label="Schedule">
                <span className="font-mono text-xs">{cronJob.schedule}</span>
              </Field>
              <Field label="Suspended">{cronJob.suspended ? 'Yes' : 'No'}</Field>
              <Field label="Active">{cronJob.active}</Field>
              <Field label="Concurrency Policy">{cronJob.concurrencyPolicy}</Field>
              <Field label="Last Schedule">
                {cronJob.lastScheduleTime ? new Date(cronJob.lastScheduleTime).toLocaleString() : '—'}
              </Field>
              <Field label="Age">{cronJob.age ?? '—'}</Field>
              <Field label="Created">{cronJob.createdAt ? new Date(cronJob.createdAt).toLocaleString() : '—'}</Field>
            </dl>

            <div>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-fg-subtle">Containers</h3>
              <div className="space-y-2">
                {cronJob.containers.map((container) => (
                  <div key={container.name} className="rounded-md border border-border-subtle bg-white/[0.02] px-3 py-2 text-sm">
                    <span className="font-medium text-fg">{container.name}</span>
                    <p className="mt-0.5 truncate text-xs text-fg-muted" title={container.image}>
                      {container.image}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {Object.keys(cronJob.labels).length > 0 && (
              <div>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-fg-subtle">Labels</h3>
                <div className="flex flex-wrap gap-1.5">
                  {Object.entries(cronJob.labels).map(([key, value]) => (
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
      title={`${cronJob?.name ?? ''} · YAML`}
      yaml={actions.describeYaml}
      loading={actions.describeLoading}
      error={actions.describeError}
      onClose={actions.closeDescribe}
    />
    <ConfirmDialog
      open={actions.confirmOpen}
      title={`Delete ${cronJob?.name}?`}
      message="This deletes the CronJob. Existing Jobs it created are not removed. This cannot be undone."
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
