import { SelectableRow } from '@/components/common/SelectableRow'
import { ALL_NAMESPACES } from '@/stores/useNamespaceStore'
import type { SecretSummary } from '@shared/types'

export function SecretTable({
  secrets,
  namespaceFilter,
  onSelect,
}: {
  secrets: SecretSummary[]
  namespaceFilter: string
  onSelect: (secret: SecretSummary) => void
}) {
  const showNamespaceColumn = namespaceFilter === ALL_NAMESPACES

  return (
    <table className="kp-table">
      <thead>
        <tr>
          <th>Name</th>
          {showNamespaceColumn && <th>Namespace</th>}
          <th>Type</th>
          <th>Keys</th>
          <th>Age</th>
        </tr>
      </thead>
      <tbody>
        {secrets.map((secret) => (
          <SelectableRow key={`${secret.namespace}/${secret.name}`} onSelect={() => onSelect(secret)}>
            <td className="font-medium text-fg">{secret.name}</td>
            {showNamespaceColumn && <td className="text-fg-subtle">{secret.namespace}</td>}
            <td className="text-fg-subtle">{secret.type}</td>
            <td className="tabular-nums text-fg-muted">{secret.keyCount}</td>
            <td className="text-fg-subtle">{secret.age ?? '—'}</td>
          </SelectableRow>
        ))}
      </tbody>
    </table>
  )
}
