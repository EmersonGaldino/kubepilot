import { SelectableRow } from '@/components/common/SelectableRow'
import { WorkloadStatusBadge } from '@/components/common/StatusBadge'
import { ALL_NAMESPACES } from '@/stores/useNamespaceStore'
import type { StatefulSetSummary } from '@shared/types'

export function StatefulSetTable({
  statefulsets,
  namespaceFilter,
  onSelect,
}: {
  statefulsets: StatefulSetSummary[]
  namespaceFilter: string
  onSelect: (statefulSet: StatefulSetSummary) => void
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
          <th>Updated</th>
          <th>Available</th>
          <th>Age</th>
        </tr>
      </thead>
      <tbody>
        {statefulsets.map((statefulSet) => (
          <SelectableRow key={`${statefulSet.namespace}/${statefulSet.name}`} onSelect={() => onSelect(statefulSet)}>
            <td className="font-medium text-fg">{statefulSet.name}</td>
            {showNamespaceColumn && <td className="text-fg-subtle">{statefulSet.namespace}</td>}
            <td>
              <WorkloadStatusBadge status={statefulSet.status} />
            </td>
            <td className="tabular-nums text-fg-muted">{statefulSet.ready}</td>
            <td className="tabular-nums text-fg-muted">{statefulSet.updatedReplicas}</td>
            <td className="tabular-nums text-fg-muted">{statefulSet.availableReplicas}</td>
            <td className="text-fg-subtle">{statefulSet.age ?? '—'}</td>
          </SelectableRow>
        ))}
      </tbody>
    </table>
  )
}
