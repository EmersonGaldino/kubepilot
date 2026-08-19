import { SelectableRow } from '@/components/common/SelectableRow'
import { WorkloadStatusBadge } from '@/components/common/StatusBadge'
import { ALL_NAMESPACES } from '@/stores/useNamespaceStore'
import type { DaemonSetSummary } from '@shared/types'

export function DaemonSetTable({
  daemonsets,
  namespaceFilter,
  onSelect,
}: {
  daemonsets: DaemonSetSummary[]
  namespaceFilter: string
  onSelect: (daemonSet: DaemonSetSummary) => void
}) {
  const showNamespaceColumn = namespaceFilter === ALL_NAMESPACES

  return (
    <table className="kp-table">
      <thead>
        <tr>
          <th>Name</th>
          {showNamespaceColumn && <th>Namespace</th>}
          <th>Status</th>
          <th>Ready</th>
          <th>Desired</th>
          <th>Updated</th>
          <th>Available</th>
          <th>Age</th>
        </tr>
      </thead>
      <tbody>
        {daemonsets.map((daemonSet) => (
          <SelectableRow key={`${daemonSet.namespace}/${daemonSet.name}`} onSelect={() => onSelect(daemonSet)}>
            <td className="font-medium text-fg">{daemonSet.name}</td>
            {showNamespaceColumn && <td className="text-fg-subtle">{daemonSet.namespace}</td>}
            <td>
              <WorkloadStatusBadge status={daemonSet.status} />
            </td>
            <td className="tabular-nums text-fg-muted">{daemonSet.ready}</td>
            <td className="tabular-nums text-fg-muted">{daemonSet.desiredScheduled}</td>
            <td className="tabular-nums text-fg-muted">{daemonSet.updatedScheduled}</td>
            <td className="tabular-nums text-fg-muted">{daemonSet.availableScheduled}</td>
            <td className="text-fg-subtle">{daemonSet.age ?? '—'}</td>
          </SelectableRow>
        ))}
      </tbody>
    </table>
  )
}
