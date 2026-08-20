import type { ReactNode } from 'react'

import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { DescribeModal } from '@/components/common/DescribeModal'
import { Skeleton } from '@/components/common/Skeleton'
import { Drawer } from '@/components/ui/Drawer'
import { useResourceActions } from '@/hooks/useResourceActions'
import { usePvStore } from '@/stores/usePvStore'
import type { PvDetail } from '@shared/types'

export function PvDetailsDrawer({
  pv,
  loading,
  onClose,
}: {
  pv: PvDetail | null
  loading: boolean
  onClose: () => void
}) {
  const loadPvs = usePvStore((s) => s.loadPvs)
  const loadPvDetail = usePvStore((s) => s.loadPvDetail)
  const refresh = () => {
    void loadPvs()
    if (pv) void loadPvDetail(pv.name)
  }
  const actions = useResourceActions(refresh)
  if (!pv && !loading) return null

  return (
    <>
      <Drawer title="PersistentVolume Details" onClose={onClose}>
        {loading || !pv ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-4 w-full" />
            ))}
          </div>
        ) : (
          <div className="space-y-5">
            <p className="text-base font-medium text-fg">{pv.name}</p>
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <Field label="Status">{pv.status}</Field>
              <Field label="Capacity">{pv.capacity ?? '—'}</Field>
              <Field label="Access modes">{pv.accessModes || '—'}</Field>
              <Field label="Reclaim">{pv.reclaimPolicy ?? '—'}</Field>
              <Field label="Storage class">{pv.storageClass ?? '—'}</Field>
              <Field label="Claim">{pv.claimRef ?? '—'}</Field>
            </dl>
            {actions.actionError && <p className="text-xs text-red-400">{actions.actionError}</p>}
            <div className="flex flex-wrap gap-2 border-t border-border-subtle pt-4">
              <button
                onClick={() => void actions.describe('persistentvolume', '', pv.name)}
                className="rounded-md bg-white/[0.06] px-3 py-1.5 text-xs font-medium text-fg-muted hover:bg-white/[0.1]"
              >
                Describe
              </button>
              <button
                onClick={() => actions.requestDelete('persistentvolume', '', pv.name)}
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
        title={`${pv?.name ?? ''} · YAML`}
        yaml={actions.describeYaml}
        loading={actions.describeLoading}
        error={actions.describeError}
        onClose={actions.closeDescribe}
        onApplied={refresh}
      />
      <ConfirmDialog
        open={actions.confirmOpen}
        title={`Delete PV ${pv?.name}?`}
        message="This deletes the PersistentVolume object. Data on the backing storage may be lost depending on reclaim policy."
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
