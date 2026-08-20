import { SelectableRow } from '@/components/common/SelectableRow'
import type { StorageClassSummary } from '@shared/types'

export function StorageClassTable({
  items,
  onSelect,
}: {
  items: StorageClassSummary[]
  onSelect: (item: StorageClassSummary) => void
}) {
  return (
    <table className="kp-table">
      <thead>
        <tr>
          <th>Name</th>
          <th>Provisioner</th>
          <th>Reclaim</th>
          <th>Binding</th>
          <th>Default</th>
          <th>Age</th>
        </tr>
      </thead>
      <tbody>
        {items.map((item) => (
          <SelectableRow key={item.name} onSelect={() => onSelect(item)}>
            <td className="font-medium text-fg">{item.name}</td>
            <td className="text-fg-muted">{item.provisioner}</td>
            <td className="text-fg-muted">{item.reclaimPolicy ?? '—'}</td>
            <td className="text-fg-muted">{item.volumeBindingMode ?? '—'}</td>
            <td className="text-fg-muted">{item.isDefault ? 'Yes' : '—'}</td>
            <td className="text-fg-subtle">{item.age ?? '—'}</td>
          </SelectableRow>
        ))}
      </tbody>
    </table>
  )
}
