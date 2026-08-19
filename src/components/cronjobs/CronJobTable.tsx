import clsx from 'clsx'

import { SelectableRow } from '@/components/common/SelectableRow'
import { ALL_NAMESPACES } from '@/stores/useNamespaceStore'
import type { CronJobSummary } from '@shared/types'

function SuspendedBadge({ suspended }: { suspended: boolean }) {
  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset',
        suspended ? 'bg-amber-500/15 text-amber-300 ring-amber-500/30' : 'bg-emerald-500/15 text-emerald-300 ring-emerald-500/30',
      )}
    >
      {suspended ? 'Yes' : 'No'}
    </span>
  )
}

export function CronJobTable({
  cronjobs,
  namespaceFilter,
  onSelect,
}: {
  cronjobs: CronJobSummary[]
  namespaceFilter: string
  onSelect: (cronJob: CronJobSummary) => void
}) {
  const showNamespaceColumn = namespaceFilter === ALL_NAMESPACES

  return (
    <table className="kp-table">
      <thead>
        <tr>
          <th>Name</th>
          {showNamespaceColumn && <th>Namespace</th>}
          <th>Schedule</th>
          <th>Suspended</th>
          <th>Active</th>
          <th>Last Schedule</th>
          <th>Age</th>
        </tr>
      </thead>
      <tbody>
        {cronjobs.map((cronJob) => (
          <SelectableRow key={`${cronJob.namespace}/${cronJob.name}`} onSelect={() => onSelect(cronJob)}>
            <td className="font-medium text-fg">{cronJob.name}</td>
            {showNamespaceColumn && <td className="text-fg-subtle">{cronJob.namespace}</td>}
            <td className="font-mono text-xs text-fg-muted">{cronJob.schedule}</td>
            <td>
              <SuspendedBadge suspended={cronJob.suspended} />
            </td>
            <td className="tabular-nums text-fg-muted">{cronJob.active}</td>
            <td className="text-fg-subtle">
              {cronJob.lastScheduleTime ? new Date(cronJob.lastScheduleTime).toLocaleString() : '—'}
            </td>
            <td className="text-fg-subtle">{cronJob.age ?? '—'}</td>
          </SelectableRow>
        ))}
      </tbody>
    </table>
  )
}
