import { Bell, Keyboard, RefreshCw } from 'lucide-react'

import { Drawer } from '@/components/ui/Drawer'
import { useSettingsDrawerStore } from '@/stores/useSettingsDrawerStore'

const COMING_SOON = [
  { icon: Bell, title: 'Notifications', detail: 'macOS alerts when a workload fails or a pod starts crash-looping.' },
  { icon: RefreshCw, title: 'Auto-refresh', detail: 'Configurable polling so lists stay current without a manual refresh.' },
]

export function SettingsDrawer() {
  const open = useSettingsDrawerStore((s) => s.open)
  const setOpen = useSettingsDrawerStore((s) => s.setOpen)

  if (!open) return null

  return (
    <Drawer title="Settings" subtitle="Preferences for this machine" onClose={() => setOpen(false)}>
      <div className="space-y-5">
        <p className="text-sm leading-relaxed text-fg-muted">
          KubePilot reads live from your kubeconfig. Cluster switching never writes back to the file.
        </p>
        <div className="flex gap-3 rounded-lg border border-border-subtle bg-white/[0.02] p-3">
          <Keyboard className="mt-0.5 h-4 w-4 shrink-0 text-fg-subtle" strokeWidth={1.75} />
          <div>
            <p className="text-sm font-medium text-fg">Command palette</p>
            <p className="mt-0.5 text-xs leading-relaxed text-fg-muted">
              Press <kbd className="rounded border border-border-subtle px-1 py-0.5 text-[10px]">⌘K</kbd> (or{' '}
              <kbd className="rounded border border-border-subtle px-1 py-0.5 text-[10px]">Ctrl+K</kbd>) anywhere to
              jump to a page, switch clusters, or run an action.
            </p>
          </div>
        </div>
        <div>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-fg-subtle">Coming next</h3>
          <ul className="space-y-2">
            {COMING_SOON.map(({ icon: Icon, title, detail }) => (
              <li key={title} className="flex gap-3 rounded-lg border border-border-subtle bg-white/[0.02] p-3">
                <Icon className="mt-0.5 h-4 w-4 shrink-0 text-fg-subtle" strokeWidth={1.75} />
                <div>
                  <p className="text-sm font-medium text-fg">{title}</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-fg-muted">{detail}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Drawer>
  )
}
