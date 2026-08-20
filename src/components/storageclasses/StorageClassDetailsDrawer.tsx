import type { ReactNode } from 'react'

import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { DescribeModal } from '@/components/common/DescribeModal'
import { Skeleton } from '@/components/common/Skeleton'
import { Drawer } from '@/components/ui/Drawer'
import { useResourceActions } from '@/hooks/useResourceActions'
import { useStorageClassStore } from '@/stores/useStorageClassStore'
import type { StorageClassDetail } from '@shared/types'

export function StorageClassDetailsDrawer({
  storageClass,
  loading,
  onClose,
}: {
  storageClass: StorageClassDetail | null
  loading: boolean
  onClose: () => void
}) {
  const loadStorageClasses = useStorageClassStore((s) => s.loadStorageClasses)
  const loadStorageClassDetail = useStorageClassStore((s) => s.loadStorageClassDetail)
  const refresh = () => {
    void loadStorageClasses()
    if (storageClass) void loadStorageClassDetail(storageClass.name)
  }
  const actions = useResourceActions(refresh)
  if (!storageClass && !loading) return null

  return (
    <>
      <Drawer title="StorageClass Details" onClose={onClose}>
        {loading || !storageClass ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-4 w-full" />
            ))}
          </div>
        ) : (
          <div className="space-y-5">
            <p className="text-base font-medium text-fg">{storageClass.name}</p>
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <Field label="Provisioner">{storageClass.provisioner}</Field>
              <Field label="Reclaim">{storageClass.reclaimPolicy ?? '—'}</Field>
              <Field label="Binding">{storageClass.volumeBindingMode ?? '—'}</Field>
              <Field label="Default">{storageClass.isDefault ? 'Yes' : 'No'}</Field>
            </dl>
            {Object.keys(storageClass.parameters).length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {Object.entries(storageClass.parameters).map(([k, v]) => (
                  <span key={k} className="rounded bg-white/[0.05] px-1.5 py-0.5 text-[11px] text-fg-muted">
                    {k}={v}
                  </span>
                ))}
              </div>
            )}
            {actions.actionError && <p className="text-xs text-red-400">{actions.actionError}</p>}
            <div className="flex flex-wrap gap-2 border-t border-border-subtle pt-4">
              <button
                onClick={() => void actions.describe('storageclass', '', storageClass.name)}
                className="rounded-md bg-white/[0.06] px-3 py-1.5 text-xs font-medium text-fg-muted hover:bg-white/[0.1]"
              >
                Describe
              </button>
              <button
                onClick={() => actions.requestDelete('storageclass', '', storageClass.name)}
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
        title={`${storageClass?.name ?? ''} · YAML`}
        yaml={actions.describeYaml}
        loading={actions.describeLoading}
        error={actions.describeError}
        onClose={actions.closeDescribe}
        onApplied={refresh}
      />
      <ConfirmDialog
        open={actions.confirmOpen}
        title={`Delete StorageClass ${storageClass?.name}?`}
        message="Existing volumes are not deleted. New claims will no longer use this class."
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
