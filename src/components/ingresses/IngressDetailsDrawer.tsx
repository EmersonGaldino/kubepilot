import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { DescribeModal } from '@/components/common/DescribeModal'
import { Skeleton } from '@/components/common/Skeleton'
import { Drawer } from '@/components/ui/Drawer'
import { useResourceActions } from '@/hooks/useResourceActions'
import { useIngressStore } from '@/stores/useIngressStore'
import { useNamespaceStore } from '@/stores/useNamespaceStore'
import type { IngressDetail } from '@shared/types'

export function IngressDetailsDrawer({
  ingress,
  loading,
  onClose,
}: {
  ingress: IngressDetail | null
  loading: boolean
  onClose: () => void
}) {
  const namespaceFilter = useNamespaceStore((s) => s.selected)
  const loadIngresses = useIngressStore((s) => s.loadIngresses)
  const loadIngressDetail = useIngressStore((s) => s.loadIngressDetail)
  const refresh = () => {
    void loadIngresses(namespaceFilter)
    if (ingress) void loadIngressDetail(ingress.namespace, ingress.name)
  }
  const actions = useResourceActions(refresh)
  if (!ingress && !loading) return null

  return (
    <>
      <Drawer title="Ingress Details" onClose={onClose}>
        {loading || !ingress ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-4 w-full" />
            ))}
          </div>
        ) : (
          <div className="space-y-5">
            <div>
              <p className="text-base font-medium text-fg">{ingress.name}</p>
              <p className="text-xs text-fg-muted">{ingress.namespace}</p>
            </div>
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <Field label="Class">{ingress.className ?? '—'}</Field>
              <Field label="Address">{ingress.address ?? '—'}</Field>
              <Field label="Ports">{ingress.ports}</Field>
              <Field label="Age">{ingress.age ?? '—'}</Field>
            </dl>
            {ingress.rules.length > 0 && (
              <div>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-fg-subtle">Rules</h3>
                <ul className="space-y-1 text-xs text-fg-muted">
                  {ingress.rules.map((rule, i) => (
                    <li key={i}>
                      {rule.host}
                      {rule.path} →{' '}
                      {rule.serviceName ? (
                        <Link className="text-blue-300 hover:underline" to="/services">
                          {rule.serviceName}:{rule.servicePort ?? '?'}
                        </Link>
                      ) : (
                        '—'
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {ingress.tlsSecrets.length > 0 && (
              <p className="text-xs text-fg-muted">TLS: {ingress.tlsSecrets.join(', ')}</p>
            )}
            {actions.actionError && <p className="text-xs text-red-400">{actions.actionError}</p>}
            <div className="flex flex-wrap gap-2 border-t border-border-subtle pt-4">
              <button
                onClick={() => void actions.describe('ingress', ingress.namespace, ingress.name)}
                className="rounded-md bg-white/[0.06] px-3 py-1.5 text-xs font-medium text-fg-muted hover:bg-white/[0.1]"
              >
                Describe
              </button>
              <button
                onClick={() => actions.requestDelete('ingress', ingress.namespace, ingress.name)}
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
        title={`${ingress?.name ?? ''} · YAML`}
        yaml={actions.describeYaml}
        loading={actions.describeLoading}
        error={actions.describeError}
        onClose={actions.closeDescribe}
        onApplied={refresh}
      />
      <ConfirmDialog
        open={actions.confirmOpen}
        title={`Delete ${ingress?.name}?`}
        message="This deletes the Ingress. This cannot be undone."
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
