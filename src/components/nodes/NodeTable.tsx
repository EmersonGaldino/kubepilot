import { SelectableRow } from '@/components/common/SelectableRow'
import type { NodeSummary } from '@shared/types'

export function NodeTable({ nodes, onSelect }: { nodes: NodeSummary[]; onSelect: (node: NodeSummary) => void }) {
  return (
    <table className="kp-table">
      <thead>
        <tr>
          <th>Name</th>
          <th>Status</th>
          <th>Roles</th>
          <th>Kubelet</th>
          <th>CPU</th>
          <th>Memory</th>
          <th>Age</th>
        </tr>
      </thead>
      <tbody>
        {nodes.map((node) => (
          <SelectableRow key={node.name} onSelect={() => onSelect(node)}>
            <td className="font-medium text-fg">{node.name}</td>
            <td className={node.ready ? 'text-emerald-300' : 'text-danger'}>
              {node.ready ? 'Ready' : 'NotReady'}
              {node.unschedulable ? ' · SchedulingDisabled' : ''}
            </td>
            <td className="text-fg-muted">{node.roles}</td>
            <td className="font-mono text-xs text-fg-muted">{node.kubeletVersion ?? '—'}</td>
            <td className="tabular-nums text-fg-muted">{node.cpuAllocatable ?? '—'}</td>
            <td className="tabular-nums text-fg-muted">{node.memoryAllocatable ?? '—'}</td>
            <td className="text-fg-subtle">{node.age ?? '—'}</td>
          </SelectableRow>
        ))}
      </tbody>
    </table>
  )
}
