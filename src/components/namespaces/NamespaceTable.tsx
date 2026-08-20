import { SelectableRow } from '@/components/common/SelectableRow'
import type { NamespaceSummary } from '@shared/types'

export function NamespaceTable({
  namespaces,
  onSelect,
}: {
  namespaces: NamespaceSummary[]
  onSelect: (ns: NamespaceSummary) => void
}) {
  return (
    <table className="kp-table">
      <thead>
        <tr>
          <th>Name</th>
          <th>Status</th>
          <th>Labels</th>
          <th>Age</th>
        </tr>
      </thead>
      <tbody>
        {namespaces.map((ns) => (
          <SelectableRow key={ns.name} onSelect={() => onSelect(ns)}>
            <td className="font-medium text-fg">{ns.name}</td>
            <td className="text-fg-muted">{ns.status}</td>
            <td className="max-w-xs truncate text-xs text-fg-subtle">
              {Object.entries(ns.labels)
                .slice(0, 3)
                .map(([k, v]) => `${k}=${v}`)
                .join(', ') || '—'}
            </td>
            <td className="text-fg-subtle">{ns.age ?? '—'}</td>
          </SelectableRow>
        ))}
      </tbody>
    </table>
  )
}
