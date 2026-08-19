import { SelectableRow } from '@/components/common/SelectableRow'
import { ALL_NAMESPACES } from '@/stores/useNamespaceStore'
import type { ServiceSummary } from '@shared/types'

export function ServiceTable({
  services,
  namespaceFilter,
  onSelect,
}: {
  services: ServiceSummary[]
  namespaceFilter: string
  onSelect: (service: ServiceSummary) => void
}) {
  const showNamespaceColumn = namespaceFilter === ALL_NAMESPACES

  return (
    <table className="kp-table">
      <thead>
        <tr>
          <th>Name</th>
          {showNamespaceColumn && <th>Namespace</th>}
          <th>Type</th>
          <th>Cluster IP</th>
          <th>External IP</th>
          <th>Ports</th>
          <th>Age</th>
        </tr>
      </thead>
      <tbody>
        {services.map((service) => (
          <SelectableRow key={`${service.namespace}/${service.name}`} onSelect={() => onSelect(service)}>
            <td className="font-medium text-fg">{service.name}</td>
            {showNamespaceColumn && <td className="text-fg-subtle">{service.namespace}</td>}
            <td className="text-fg-muted">{service.type}</td>
            <td className="font-mono text-xs text-fg-muted">{service.clusterIP ?? '—'}</td>
            <td className="text-fg-muted">{service.externalIP ?? '—'}</td>
            <td className="text-fg-muted">{service.ports || '—'}</td>
            <td className="text-fg-subtle">{service.age ?? '—'}</td>
          </SelectableRow>
        ))}
      </tbody>
    </table>
  )
}
