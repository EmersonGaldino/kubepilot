import { SelectableRow } from '@/components/common/SelectableRow'
import { ALL_NAMESPACES } from '@/stores/useNamespaceStore'
import type { HpaSummary } from '@shared/types'

export function HpaTable({
  items,
  namespaceFilter,
  onSelect,
}: {
  items: HpaSummary[]
  namespaceFilter: string
  onSelect: (item: HpaSummary) => void
}) {
  const showNs = namespaceFilter === ALL_NAMESPACES
  return (
    <table className="kp-table">
      <thead>
        <tr>
          <th>Name</th>
          {showNs && <th>Namespace</th>}
          <th>Target</th>
          <th>Min/Max</th>
          <th>Replicas</th>
          <th>Metric</th>
          <th>Age</th>
        </tr>
      </thead>
      <tbody>
        {items.map((item) => (
          <SelectableRow key={`${item.namespace}/${item.name}`} onSelect={() => onSelect(item)}>
            <td className="font-medium text-fg">{item.name}</td>
            {showNs && <td className="text-fg-subtle">{item.namespace}</td>}
            <td className="text-fg-muted">
              {item.targetKind}/{item.targetName}
            </td>
            <td className="tabular-nums text-fg-muted">
              {item.minReplicas}/{item.maxReplicas}
            </td>
            <td className="tabular-nums text-fg-muted">
              {item.currentReplicas ?? '—'}/{item.desiredReplicas ?? '—'}
            </td>
            <td className="text-fg-muted">
              {item.currentMetric ?? 'Metrics unavailable'}
              <span className="block text-[11px] text-fg-subtle">{item.primaryMetric}</span>
            </td>
            <td className="text-fg-subtle">{item.age ?? '—'}</td>
          </SelectableRow>
        ))}
      </tbody>
    </table>
  )
}
