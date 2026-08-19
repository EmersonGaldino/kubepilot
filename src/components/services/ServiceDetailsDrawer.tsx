import type { ReactNode } from 'react'

import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { Drawer } from '@/components/ui/Drawer'
import { DescribeModal } from '@/components/common/DescribeModal'
import { Skeleton } from '@/components/common/Skeleton'
import { useResourceActions } from '@/hooks/useResourceActions'
import { useNamespaceStore } from '@/stores/useNamespaceStore'
import { useServiceStore } from '@/stores/useServiceStore'
import type { ServiceDetail } from '@shared/types'

export function ServiceDetailsDrawer({
  service,
  loading,
  onClose,
}: {
  service: ServiceDetail | null
  loading: boolean
  onClose: () => void
}) {
  const namespaceFilter = useNamespaceStore((s) => s.selected)
  const loadServices = useServiceStore((s) => s.loadServices)
  const loadServiceDetail = useServiceStore((s) => s.loadServiceDetail)

  const refreshAfterMutation = () => {
    void loadServices(namespaceFilter)
    if (service) void loadServiceDetail(service.namespace, service.name)
  }

  const actions = useResourceActions(refreshAfterMutation)

  if (!service && !loading) return null

  const doDelete = () => {
    if (!service) return
    actions.requestDelete('service', service.namespace, service.name)
  }

  const doDescribe = () => {
    if (!service) return
    void actions.describe('service', service.namespace, service.name)
  }

  const handleDeleteConfirmed = async () => {
    if (await actions.confirmDelete()) onClose()
  }

  return (
    <>
    <Drawer title="Service Details" onClose={onClose}>

        {loading || !service ? (
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-4 w-full" />
            ))}
          </div>
        ) : (
          <div className="space-y-5">
            <div>
              <p className="text-base font-medium text-fg">{service.name}</p>
              <p className="text-xs text-fg-muted">{service.namespace}</p>
            </div>

            <dl className="grid grid-cols-2 gap-3 text-sm">
              <Field label="Type">{service.type}</Field>
              <Field label="Cluster IP">{service.clusterIP ?? '—'}</Field>
              <Field label="External IP">{service.externalIP ?? '—'}</Field>
              <Field label="Age">{service.age ?? '—'}</Field>
              <Field label="Created">{service.createdAt ? new Date(service.createdAt).toLocaleString() : '—'}</Field>
            </dl>

            <div>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-fg-subtle">Ports</h3>
              {service.portList.length > 0 ? (
                <div className="overflow-hidden rounded-md border border-border-subtle">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-border-subtle uppercase tracking-wide text-fg-subtle">
                        <th className="px-2.5 py-1.5 font-medium">Name</th>
                        <th className="px-2.5 py-1.5 font-medium">Port</th>
                        <th className="px-2.5 py-1.5 font-medium">Target</th>
                        <th className="px-2.5 py-1.5 font-medium">Node</th>
                        <th className="px-2.5 py-1.5 font-medium">Proto</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {service.portList.map((p, i) => (
                        <tr key={i}>
                          <td className="px-2.5 py-1.5 text-fg-muted">{p.name ?? '—'}</td>
                          <td className="px-2.5 py-1.5 tabular-nums text-fg-muted">{p.port}</td>
                          <td className="px-2.5 py-1.5 tabular-nums text-fg-muted">{p.targetPort ?? '—'}</td>
                          <td className="px-2.5 py-1.5 tabular-nums text-fg-muted">{p.nodePort ?? '—'}</td>
                          <td className="px-2.5 py-1.5 text-fg-muted">{p.protocol}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-xs text-fg-muted">No ports defined.</p>
              )}
            </div>

            {Object.keys(service.selector).length > 0 && (
              <div>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-fg-subtle">Selector</h3>
                <div className="flex flex-wrap gap-1.5">
                  {Object.entries(service.selector).map(([key, value]) => (
                    <span key={key} className="rounded bg-white/[0.05] px-1.5 py-0.5 text-[11px] text-fg-muted">
                      {key}={value}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {Object.keys(service.labels).length > 0 && (
              <div>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-fg-subtle">Labels</h3>
                <div className="flex flex-wrap gap-1.5">
                  {Object.entries(service.labels).map(([key, value]) => (
                    <span key={key} className="rounded bg-white/[0.05] px-1.5 py-0.5 text-[11px] text-fg-muted">
                      {key}={value}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {actions.actionError && <p className="text-xs text-red-400">{actions.actionError}</p>}

            <div className="flex flex-wrap items-center gap-2 border-t border-border-subtle pt-4">
              <button
                onClick={doDescribe}
                className="rounded-md bg-white/[0.06] px-3 py-1.5 text-xs font-medium text-fg-muted transition hover:bg-white/[0.1]"
              >
                Describe
              </button>
              <button
                onClick={doDelete}
                disabled={actions.busy}
                className="rounded-md bg-red-500/15 px-3 py-1.5 text-xs font-medium text-red-300 transition hover:bg-red-500/25 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Delete
              </button>
            </div>
          </div>
        )}
    </Drawer>

    <DescribeModal
      open={actions.describeOpen}
      title={`${service?.name ?? ''} · YAML`}
      yaml={actions.describeYaml}
      loading={actions.describeLoading}
      error={actions.describeError}
      onClose={actions.closeDescribe}
    />
    <ConfirmDialog
      open={actions.confirmOpen}
      title={`Delete ${service?.name}?`}
      message="This deletes the Service. This cannot be undone."
      busy={actions.busy}
      onConfirm={() => void handleDeleteConfirmed()}
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
