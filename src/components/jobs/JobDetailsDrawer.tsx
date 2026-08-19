import clsx from 'clsx'
import type { ReactNode } from 'react'

import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { Drawer } from '@/components/ui/Drawer'
import { DescribeModal } from '@/components/common/DescribeModal'
import { Skeleton } from '@/components/common/Skeleton'
import { useResourceActions } from '@/hooks/useResourceActions'
import { useJobStore } from '@/stores/useJobStore'
import { useNamespaceStore } from '@/stores/useNamespaceStore'
import type { JobDetail, JobStatus } from '@shared/types'

const JOB_STATUS_STYLES: Record<JobStatus, string> = {
  Complete: 'bg-emerald-500/15 text-emerald-400 ring-emerald-500/30',
  Running: 'bg-blue-500/15 text-blue-400 ring-blue-500/30',
  Failed: 'bg-red-500/15 text-red-400 ring-red-500/30',
}

function JobStatusBadge({ status }: { status: JobStatus }) {
  return (
    <span className={clsx('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset', JOB_STATUS_STYLES[status])}>
      {status}
    </span>
  )
}

export function JobDetailsDrawer({
  job,
  loading,
  onClose,
}: {
  job: JobDetail | null
  loading: boolean
  onClose: () => void
}) {
  const namespaceFilter = useNamespaceStore((s) => s.selected)
  const loadJobs = useJobStore((s) => s.loadJobs)
  const loadJobDetail = useJobStore((s) => s.loadJobDetail)

  const refreshAfterMutation = () => {
    void loadJobs(namespaceFilter)
    if (job) void loadJobDetail(job.namespace, job.name)
  }

  const actions = useResourceActions(refreshAfterMutation)

  if (!job && !loading) return null

  const doDelete = () => {
    if (!job) return
    actions.requestDelete('job', job.namespace, job.name)
  }

  const doDescribe = () => {
    if (!job) return
    void actions.describe('job', job.namespace, job.name)
  }

  const handleDeleteConfirmed = async () => {
    if (await actions.confirmDelete()) onClose()
  }

  return (
    <>
    <Drawer title="Job Details" onClose={onClose}>

        {loading || !job ? (
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-4 w-full" />
            ))}
          </div>
        ) : (
          <div className="space-y-5">
            <div>
              <p className="text-base font-medium text-fg">{job.name}</p>
              <p className="text-xs text-fg-muted">{job.namespace}</p>
            </div>

            <dl className="grid grid-cols-2 gap-3 text-sm">
              <Field label="Status">
                <JobStatusBadge status={job.status} />
              </Field>
              <Field label="Completions">{job.completions}</Field>
              <Field label="Active">{job.active}</Field>
              <Field label="Age">{job.age ?? '—'}</Field>
              <Field label="Created">{job.createdAt ? new Date(job.createdAt).toLocaleString() : '—'}</Field>
              <Field label="Completed">{job.completedAt ? new Date(job.completedAt).toLocaleString() : '—'}</Field>
            </dl>

            <div>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-fg-subtle">Containers</h3>
              <div className="space-y-2">
                {job.containers.map((container) => (
                  <div key={container.name} className="rounded-md border border-border-subtle bg-white/[0.02] px-3 py-2 text-sm">
                    <span className="font-medium text-fg">{container.name}</span>
                    <p className="mt-0.5 truncate text-xs text-fg-muted" title={container.image}>
                      {container.image}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {job.conditions.length > 0 && (
              <div>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-fg-subtle">Conditions</h3>
                <div className="space-y-2">
                  {job.conditions.map((condition) => (
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

            {Object.keys(job.labels).length > 0 && (
              <div>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-fg-subtle">Labels</h3>
                <div className="flex flex-wrap gap-1.5">
                  {Object.entries(job.labels).map(([key, value]) => (
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
      title={`${job?.name ?? ''} · YAML`}
      yaml={actions.describeYaml}
      loading={actions.describeLoading}
      error={actions.describeError}
      onClose={actions.closeDescribe}
    />
    <ConfirmDialog
      open={actions.confirmOpen}
      title={`Delete ${job?.name}?`}
      message="This deletes the Job and its pods. This cannot be undone."
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
