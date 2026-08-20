import { SelectableRow } from '@/components/common/SelectableRow'
import { ALL_NAMESPACES } from '@/stores/useNamespaceStore'
import type { PvcSummary } from '@shared/types'

export function PvcTable({
  items,
  namespaceFilter,
  onSelect,
}: {
  items: PvcSummary[]
  namespaceFilter: string
  onSelect: (item: PvcSummary) => void
}) {
  const showNs = namespaceFilter === ALL_NAMESPACES
  return (
    <table className="kp-table">
      <thead>
        <tr>
          <th>Name</th>
          {showNs && <th>Namespace</th>}
          <th>Status</th>
          <th>Volume</th>
          <th>Capacity</th>
          <th>Access</th>
          <th>StorageClass</th>
          <th>Age</th>
        </tr>
      </thead>
      <tbody>
        {items.map((item) => (
          <SelectableRow key={`${item.namespace}/${item.name}`} onSelect={() => onSelect(item)}>
            <td className="font-medium text-fg">{item.name}</td>
            {showNs && <td className="text-fg-subtle">{item.namespace}</td>}
            <td className="text-fg-muted">{item.phase}</td>
            <td className="text-fg-muted">{item.volumeName ?? '—'}</td>
            <td className="tabular-nums text-fg-muted">{item.capacity ?? '—'}</td>
            <td className="text-fg-muted">{item.accessModes || '—'}</td>
            <td className="text-fg-muted">{item.storageClass ?? '—'}</td>
            <td className="text-fg-subtle">{item.age ?? '—'}</td>
          </SelectableRow>
        ))}
      </tbody>
    </table>
  )
}
