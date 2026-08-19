import { SelectableRow } from '@/components/common/SelectableRow'
import { PodPhaseBadge } from '@/components/common/StatusBadge'
import { ALL_NAMESPACES } from '@/stores/useNamespaceStore'
import type { PodSummary } from '@shared/types'

export function PodTable({
  pods,
  namespaceFilter,
  onSelect,
}: {
  pods: PodSummary[]
  namespaceFilter: string
  onSelect: (pod: PodSummary) => void
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
          <th>Restarts</th>
          <th>Node</th>
          <th>Age</th>
        </tr>
      </thead>
      <tbody>
        {pods.map((pod) => (
          <SelectableRow key={`${pod.namespace}/${pod.name}`} onSelect={() => onSelect(pod)}>
            <td className="font-medium text-fg">{pod.name}</td>
            {showNamespaceColumn && <td className="text-fg-subtle">{pod.namespace}</td>}
            <td>
              <PodPhaseBadge phase={pod.phase} />
            </td>
            <td className="tabular-nums text-fg-muted">{pod.ready}</td>
            <td className="tabular-nums text-fg-muted">{pod.restarts}</td>
            <td className="max-w-[10rem] truncate text-fg-subtle">{pod.node ?? '—'}</td>
            <td className="text-fg-subtle">{pod.age ?? '—'}</td>
          </SelectableRow>
        ))}
      </tbody>
    </table>
  )
}
