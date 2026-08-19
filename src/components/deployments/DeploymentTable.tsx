import { SelectableRow } from '@/components/common/SelectableRow'
import { WorkloadStatusBadge } from '@/components/common/StatusBadge'
import { ALL_NAMESPACES } from '@/stores/useNamespaceStore'
import type { DeploymentSummary } from '@shared/types'

export function DeploymentTable({
  deployments,
  namespaceFilter,
  onSelect,
}: {
  deployments: DeploymentSummary[]
  namespaceFilter: string
  onSelect: (deployment: DeploymentSummary) => void
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
        {deployments.map((deployment) => (
          <SelectableRow key={`${deployment.namespace}/${deployment.name}`} onSelect={() => onSelect(deployment)}>
            <td className="font-medium text-fg">{deployment.name}</td>
            {showNamespaceColumn && <td className="text-fg-subtle">{deployment.namespace}</td>}
            <td>
              <WorkloadStatusBadge status={deployment.status} />
            </td>
            <td className="tabular-nums text-fg-muted">{deployment.ready}</td>
            <td className="tabular-nums text-fg-muted">{deployment.updatedReplicas}</td>
            <td className="tabular-nums text-fg-muted">{deployment.availableReplicas}</td>
            <td className="text-fg-subtle">{deployment.age ?? '—'}</td>
          </SelectableRow>
        ))}
      </tbody>
    </table>
  )
}
