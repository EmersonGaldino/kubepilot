import { SelectableRow } from '@/components/common/SelectableRow'
import { ALL_NAMESPACES } from '@/stores/useNamespaceStore'
import type { ConfigMapSummary } from '@shared/types'

export function ConfigMapTable({
  configMaps,
  namespaceFilter,
  onSelect,
}: {
  configMaps: ConfigMapSummary[]
  namespaceFilter: string
  onSelect: (configMap: ConfigMapSummary) => void
}) {
  const showNamespaceColumn = namespaceFilter === ALL_NAMESPACES

  return (
    <table className="kp-table">
      <thead>
        <tr>
          <th>Name</th>
          {showNamespaceColumn && <th>Namespace</th>}
          <th>Keys</th>
          <th>Age</th>
        </tr>
      </thead>
      <tbody>
        {configMaps.map((configMap) => (
          <SelectableRow key={`${configMap.namespace}/${configMap.name}`} onSelect={() => onSelect(configMap)}>
            <td className="font-medium text-fg">{configMap.name}</td>
            {showNamespaceColumn && <td className="text-fg-subtle">{configMap.namespace}</td>}
            <td className="tabular-nums text-fg-muted">{configMap.keyCount}</td>
            <td className="text-fg-subtle">{configMap.age ?? '—'}</td>
          </SelectableRow>
        ))}
      </tbody>
    </table>
  )
}
