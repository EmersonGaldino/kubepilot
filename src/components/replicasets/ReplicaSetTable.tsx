import { SelectableRow } from '@/components/common/SelectableRow'
import { WorkloadStatusBadge } from '@/components/common/StatusBadge'
import { ALL_NAMESPACES } from '@/stores/useNamespaceStore'
import type { ReplicaSetSummary } from '@shared/types'

export function ReplicaSetTable({
  replicaSets,
  namespaceFilter,
  onSelect,
}: {
  replicaSets: ReplicaSetSummary[]
  namespaceFilter: string
  onSelect: (replicaSet: ReplicaSetSummary) => void
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
          <th>Available</th>
          <th>Age</th>
        </tr>
      </thead>
      <tbody>
        {replicaSets.map((replicaSet) => (
          <SelectableRow key={`${replicaSet.namespace}/${replicaSet.name}`} onSelect={() => onSelect(replicaSet)}>
            <td className="font-medium text-fg">{replicaSet.name}</td>
            {showNamespaceColumn && <td className="text-fg-subtle">{replicaSet.namespace}</td>}
            <td>
              <WorkloadStatusBadge status={replicaSet.status} />
            </td>
            <td className="tabular-nums text-fg-muted">{replicaSet.ready}</td>
            <td className="tabular-nums text-fg-muted">{replicaSet.desiredReplicas}</td>
            <td className="tabular-nums text-fg-muted">{replicaSet.availableReplicas}</td>
            <td className="text-fg-subtle">{replicaSet.age ?? '—'}</td>
          </SelectableRow>
        ))}
      </tbody>
    </table>
  )
}
