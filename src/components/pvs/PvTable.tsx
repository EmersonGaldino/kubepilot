import { SelectableRow } from '@/components/common/SelectableRow'
import type { PvSummary } from '@shared/types'

export function PvTable({ items, onSelect }: { items: PvSummary[]; onSelect: (item: PvSummary) => void }) {
  return (
    <table className="kp-table">
      <thead>
        <tr>
          <th>Name</th>
          <th>Status</th>
          <th>Capacity</th>
          <th>Access</th>
          <th>Reclaim</th>
          <th>Claim</th>
          <th>Age</th>
        </tr>
      </thead>
      <tbody>
        {items.map((item) => (
          <SelectableRow key={item.name} onSelect={() => onSelect(item)}>
            <td className="font-medium text-fg">{item.name}</td>
            <td className="text-fg-muted">{item.status}</td>
            <td className="tabular-nums text-fg-muted">{item.capacity ?? '—'}</td>
            <td className="text-fg-muted">{item.accessModes || '—'}</td>
            <td className="text-fg-muted">{item.reclaimPolicy ?? '—'}</td>
            <td className="text-fg-muted">{item.claimRef ?? '—'}</td>
            <td className="text-fg-subtle">{item.age ?? '—'}</td>
          </SelectableRow>
        ))}
      </tbody>
    </table>
  )
}
