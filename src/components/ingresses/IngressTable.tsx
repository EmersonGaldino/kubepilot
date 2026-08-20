import { SelectableRow } from '@/components/common/SelectableRow'
import { ALL_NAMESPACES } from '@/stores/useNamespaceStore'
import type { IngressSummary } from '@shared/types'

export function IngressTable({
  ingresses,
  namespaceFilter,
  onSelect,
}: {
  ingresses: IngressSummary[]
  namespaceFilter: string
  onSelect: (item: IngressSummary) => void
}) {
  const showNs = namespaceFilter === ALL_NAMESPACES
  return (
    <table className="kp-table">
      <thead>
        <tr>
          <th>Name</th>
          {showNs && <th>Namespace</th>}
          <th>Hosts</th>
          <th>Address</th>
          <th>Ports</th>
          <th>Age</th>
        </tr>
      </thead>
      <tbody>
        {ingresses.map((item) => (
          <SelectableRow key={`${item.namespace}/${item.name}`} onSelect={() => onSelect(item)}>
            <td className="font-medium text-fg">{item.name}</td>
            {showNs && <td className="text-fg-subtle">{item.namespace}</td>}
            <td className="text-fg-muted">{item.hosts || '—'}</td>
            <td className="font-mono text-xs text-fg-muted">{item.address ?? '—'}</td>
            <td className="text-fg-muted">{item.ports}</td>
            <td className="text-fg-subtle">{item.age ?? '—'}</td>
          </SelectableRow>
        ))}
      </tbody>
    </table>
  )
}
