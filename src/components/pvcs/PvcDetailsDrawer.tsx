import type { ReactNode } from 'react'

import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { DescribeModal } from '@/components/common/DescribeModal'
import { Skeleton } from '@/components/common/Skeleton'
import { Drawer } from '@/components/ui/Drawer'
import { useResourceActions } from '@/hooks/useResourceActions'
import { useNamespaceStore } from '@/stores/useNamespaceStore'
import { usePvcStore } from '@/stores/usePvcStore'
import type { PvcDetail } from '@shared/types'

export function PvcDetailsDrawer({
  pvc,
  loading,
  onClose,
}: {
  pvc: PvcDetail | null
  loading: boolean
  onClose: () => void
}) {
  const namespaceFilter = useNamespaceStore((s) => s.selected)
  const loadPvcs = usePvcStore((s) => s.loadPvcs)
  const loadPvcDetail = usePvcStore((s) => s.loadPvcDetail)
  const refresh = () => {
    void loadPvcs(namespaceFilter)
    if (pvc) void loadPvcDetail(pvc.namespace, pvc.name)
  }
  const actions = useResourceActions(refresh)
  if (!pvc && !loading) return null

  return (
    <>
      <Drawer title="PVC Details" onClose={onClose}>
        {loading || !pvc ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-4 w-full" />
            ))}
          </div>
        ) : (
          <div className="space-y-5">
            <div>
              <p className="text-base font-medium text-fg">{pvc.name}</p>
              <p className="text-xs text-fg-muted">{pvc.namespace}</p>
            </div>
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <Field label="Phase">{pvc.phase}</Field>
              <Field label="Volume">{pvc.volumeName ?? '—'}</Field>
              <Field label="Capacity">{pvc.capacity ?? '—'}</Field>
              <Field label="Access modes">{pvc.accessModes || '—'}</Field>
              <Field label="Storage class">{pvc.storageClass ?? '—'}</Field>
              <Field label="Age">{pvc.age ?? '—'}</Field>
            </dl>
            {actions.actionError && <p className="text-xs text-red-400">{actions.actionError}</p>}
            <div className="flex flex-wrap gap-2 border-t border-border-subtle pt-4">
              <button
                onClick={() => void actions.describe('persistentvolumeclaim', pvc.namespace, pvc.name)}
                className="rounded-md bg-white/[0.06] px-3 py-1.5 text-xs font-medium text-fg-muted hover:bg-white/[0.1]"
              >
                Describe
              </button>
              <button
                onClick={() => actions.requestDelete('persistentvolumeclaim', pvc.namespace, pvc.name)}
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
        title={`${pvc?.name ?? ''} · YAML`}
        yaml={actions.describeYaml}
        loading={actions.describeLoading}
        error={actions.describeError}
        onClose={actions.closeDescribe}
        onApplied={refresh}
      />
      <ConfirmDialog
        open={actions.confirmOpen}
        title={`Delete PVC ${pvc?.name}?`}
        message="Deleting this PersistentVolumeClaim may permanently destroy the data on the bound volume, depending on the reclaim policy. This cannot be undone."
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
