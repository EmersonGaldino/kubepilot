import type { ReactNode } from 'react'

import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { DescribeModal } from '@/components/common/DescribeModal'
import { Skeleton } from '@/components/common/Skeleton'
import { Drawer } from '@/components/ui/Drawer'
import { useResourceActions } from '@/hooks/useResourceActions'
import { useHpaStore } from '@/stores/useHpaStore'
import { useNamespaceStore } from '@/stores/useNamespaceStore'
import type { HpaDetail } from '@shared/types'

export function HpaDetailsDrawer({
  hpa,
  loading,
  onClose,
}: {
  hpa: HpaDetail | null
  loading: boolean
  onClose: () => void
}) {
  const namespaceFilter = useNamespaceStore((s) => s.selected)
  const loadHpas = useHpaStore((s) => s.loadHpas)
  const loadHpaDetail = useHpaStore((s) => s.loadHpaDetail)
  const refresh = () => {
    void loadHpas(namespaceFilter)
    if (hpa) void loadHpaDetail(hpa.namespace, hpa.name)
  }
  const actions = useResourceActions(refresh)
  if (!hpa && !loading) return null

  return (
    <>
      <Drawer title="HPA Details" onClose={onClose}>
        {loading || !hpa ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-4 w-full" />
            ))}
          </div>
        ) : (
          <div className="space-y-5">
            <div>
              <p className="text-base font-medium text-fg">{hpa.name}</p>
              <p className="text-xs text-fg-muted">{hpa.namespace}</p>
            </div>
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <Field label="Target">
                {hpa.targetKind}/{hpa.targetName}
              </Field>
              <Field label="Min / Max">
                {hpa.minReplicas} / {hpa.maxReplicas}
              </Field>
              <Field label="Current replicas">{hpa.currentReplicas ?? '—'}</Field>
              <Field label="Desired replicas">{hpa.desiredReplicas ?? '—'}</Field>
              <Field label="Current metric">{hpa.currentMetric ?? 'Metrics unavailable'}</Field>
              <Field label="Age">{hpa.age ?? '—'}</Field>
            </dl>
            {hpa.metrics.length > 0 && (
              <p className="text-xs text-fg-muted">Policy: {hpa.metrics.join(' · ')}</p>
            )}
            {hpa.conditions.length > 0 && (
              <ul className="space-y-1 text-xs text-fg-muted">
                {hpa.conditions.map((c) => (
                  <li key={c.type}>
                    {c.type}: {c.status}
                    {c.message ? ` — ${c.message}` : ''}
                  </li>
                ))}
              </ul>
            )}
            {actions.actionError && <p className="text-xs text-red-400">{actions.actionError}</p>}
            <div className="flex flex-wrap gap-2 border-t border-border-subtle pt-4">
              <button
                onClick={() => void actions.describe('hpa', hpa.namespace, hpa.name)}
                className="rounded-md bg-white/[0.06] px-3 py-1.5 text-xs font-medium text-fg-muted hover:bg-white/[0.1]"
              >
                Describe
              </button>
              <button
                onClick={() => actions.requestDelete('hpa', hpa.namespace, hpa.name)}
                disabled={actions.busy}
                className="rounded-md bg-red-500/15 px-3 py-1.5 text-xs font-medium text-red-300 hover:bg-red-500/25 disabled:opacity-50"
              >
                Delete
              </button>
            </div>
          </div>
        )}
      </Drawer>
      <DescribeModal
        open={actions.describeOpen}
        title={`${hpa?.name ?? ''} · YAML`}
        yaml={actions.describeYaml}
        loading={actions.describeLoading}
        error={actions.describeError}
        onClose={actions.closeDescribe}
        onApplied={refresh}
      />
      <ConfirmDialog
        open={actions.confirmOpen}
        title={`Delete ${hpa?.name}?`}
        message="This deletes the HorizontalPodAutoscaler. The target workload is not deleted."
        busy={actions.busy}
        onConfirm={async () => {
          if (await actions.confirmDelete()) onClose()
        }}
        onCancel={actions.cancelDelete}
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
