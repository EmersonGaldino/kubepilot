import clsx from 'clsx'

import { SelectableRow } from '@/components/common/SelectableRow'
import { ALL_NAMESPACES } from '@/stores/useNamespaceStore'
import type { JobStatus, JobSummary } from '@shared/types'

const JOB_STATUS_STYLES: Record<JobStatus, string> = {
  Complete: 'bg-emerald-500/15 text-emerald-300 ring-emerald-500/30',
  Running: 'bg-blue-500/15 text-blue-300 ring-blue-500/30',
  Failed: 'bg-red-500/15 text-red-300 ring-red-500/30',
}

function JobStatusBadge({ status }: { status: JobStatus }) {
  return (
    <span className={clsx('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset', JOB_STATUS_STYLES[status])}>
      {status}
    </span>
  )
}

export function JobTable({
  jobs,
  namespaceFilter,
  onSelect,
}: {
  jobs: JobSummary[]
  namespaceFilter: string
  onSelect: (job: JobSummary) => void
}) {
  const showNamespaceColumn = namespaceFilter === ALL_NAMESPACES

  return (
    <table className="kp-table">
      <thead>
        <tr>
          <th>Name</th>
          {showNamespaceColumn && <th>Namespace</th>}
          <th>Status</th>
          <th>Completions</th>
          <th>Active</th>
          <th>Age</th>
        </tr>
      </thead>
      <tbody>
        {jobs.map((job) => (
          <SelectableRow key={`${job.namespace}/${job.name}`} onSelect={() => onSelect(job)}>
            <td className="font-medium text-fg">{job.name}</td>
            {showNamespaceColumn && <td className="text-fg-subtle">{job.namespace}</td>}
            <td>
              <JobStatusBadge status={job.status} />
            </td>
            <td className="tabular-nums text-fg-muted">{job.completions}</td>
            <td className="tabular-nums text-fg-muted">{job.active}</td>
            <td className="text-fg-subtle">{job.age ?? '—'}</td>
          </SelectableRow>
        ))}
      </tbody>
    </table>
  )
}
