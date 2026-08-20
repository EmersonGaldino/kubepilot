import type { ReactNode } from 'react'
import { useState } from 'react'

import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { DescribeModal } from '@/components/common/DescribeModal'
import { Skeleton } from '@/components/common/Skeleton'
import { Drawer } from '@/components/ui/Drawer'
import { useResourceActions } from '@/hooks/useResourceActions'
import { kubernetesApi } from '@/services/kubernetesApi'
import { useNodeStore } from '@/stores/useNodeStore'
import type { NodeDetail } from '@shared/types'

export function NodeDetailsDrawer({
  node,
  loading,
  onClose,
}: {
  node: NodeDetail | null
  loading: boolean
  onClose: () => void
}) {
  const loadNodes = useNodeStore((s) => s.loadNodes)
  const loadNodeDetail = useNodeStore((s) => s.loadNodeDetail)
  const actions = useResourceActions(() => {
    void loadNodes()
    if (node) void loadNodeDetail(node.name)
  })
  const [busy, setBusy] = useState(false)
  const [cordonError, setCordonError] = useState<string | null>(null)
  const [confirmCordon, setConfirmCordon] = useState(false)

  if (!node && !loading) return null

  const refresh = () => {
    void loadNodes()
    if (node) void loadNodeDetail(node.name)
  }

  const toggleCordon = async () => {
    if (!node) return
    setBusy(true)
    setCordonError(null)
    try {
      await kubernetesApi.nodes.cordon(node.name, !node.unschedulable)
      refresh()
    } catch (error) {
      setCordonError(error instanceof Error ? error.message : String(error))
    } finally {
      setBusy(false)
      setConfirmCordon(false)
    }
  }

  return (
    <>
      <Drawer title="Node Details" onClose={onClose}>
        {loading || !node ? (
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-4 w-full" />
            ))}
          </div>
        ) : (
          <div className="space-y-5">
            <div>
              <p className="text-base font-medium text-fg">{node.name}</p>
              <p className="text-xs text-fg-muted">{node.ready ? 'Ready' : 'NotReady'}</p>
            </div>
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <Field label="Roles">{node.roles}</Field>
              <Field label="Kubelet">{node.kubeletVersion ?? '—'}</Field>
              <Field label="CPU">{node.cpuAllocatable ?? '—'}</Field>
              <Field label="Memory">{node.memoryAllocatable ?? '—'}</Field>
              <Field label="Age">{node.age ?? '—'}</Field>
              <Field label="Schedulable">{node.unschedulable ? 'Disabled' : 'Enabled'}</Field>
            </dl>

            {node.addresses.length > 0 && (
              <ChipSection title="Addresses" items={node.addresses.map((a) => `${a.type}: ${a.address}`)} />
            )}
            {node.taints.length > 0 && <ChipSection title="Taints" items={node.taints} />}
            {Object.keys(node.labels).length > 0 && (
              <ChipSection title="Labels" items={Object.entries(node.labels).map(([k, v]) => `${k}=${v}`)} />
            )}
            {node.conditions.length > 0 && (
              <div>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-fg-subtle">Conditions</h3>
                <ul className="space-y-1 text-xs text-fg-muted">
                  {node.conditions.map((c) => (
                    <li key={c.type}>
                      {c.type}: {c.status}
                      {c.message ? ` — ${c.message}` : ''}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {node.pods.length > 0 && (
              <div>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-fg-subtle">Pods</h3>
                <ul className="space-y-1 text-xs text-fg-muted">
                  {node.pods.map((pod) => (
                    <li key={`${pod.namespace}/${pod.name}`}>
                      {pod.namespace}/{pod.name} · {pod.phase}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {(actions.actionError || cordonError) && (
              <p className="text-xs text-red-400">{actions.actionError ?? cordonError}</p>
            )}
            <div className="flex flex-wrap items-center gap-2 border-t border-border-subtle pt-4">
              <button
                onClick={() => void actions.describe('node', '', node.name)}
                className="rounded-md bg-white/[0.06] px-3 py-1.5 text-xs font-medium text-fg-muted transition hover:bg-white/[0.1]"
              >
                Describe
              </button>
              <button
                onClick={() => setConfirmCordon(true)}
                disabled={busy}
                className="rounded-md bg-white/[0.06] px-3 py-1.5 text-xs font-medium text-fg-muted transition hover:bg-white/[0.1] disabled:opacity-50"
              >
                {node.unschedulable ? 'Uncordon' : 'Cordon'}
              </button>
            </div>
          </div>
        )}
      </Drawer>
      <DescribeModal
        open={actions.describeOpen}
        title={`${node?.name ?? ''} · YAML`}
        yaml={actions.describeYaml}
        loading={actions.describeLoading}
        error={actions.describeError}
        onClose={actions.closeDescribe}
        onApplied={refresh}
      />
      <ConfirmDialog
        open={confirmCordon}
        title={node?.unschedulable ? `Uncordon ${node?.name}?` : `Cordon ${node?.name}?`}
        message={
          node?.unschedulable
            ? 'New pods will be allowed to schedule onto this node.'
            : 'Marks the node unschedulable. Existing pods stay; drain is not performed.'
        }
        confirmLabel={node?.unschedulable ? 'Uncordon' : 'Cordon'}
        danger={false}
        busy={busy}
        onConfirm={() => void toggleCordon()}
        onCancel={() => setConfirmCordon(false)}
      />
    </>
  )
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <dt className="text-xs text-fg-subtle">{label}</dt>
      <dd className="mt-0.5 text-fg">{children}</dd>
    </div>
  )
}

function ChipSection({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-fg-subtle">{title}</h3>
      <div className="flex flex-wrap gap-1.5">
        {items.map((item) => (
          <span key={item} className="rounded bg-white/[0.05] px-1.5 py-0.5 text-[11px] text-fg-muted">
            {item}
          </span>
        ))}
      </div>
    </div>
  )
}
