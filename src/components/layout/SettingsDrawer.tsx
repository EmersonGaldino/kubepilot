import { Bell, Keyboard, RefreshCw, ShieldCheck } from 'lucide-react'

import { Drawer } from '@/components/ui/Drawer'
import { useSettingsDrawerStore } from '@/stores/useSettingsDrawerStore'
import { useClusterStore } from '@/stores/useClusterStore'
import { useClusterPrefsStore } from '@/stores/useClusterPrefsStore'
import { useProductSettingsStore } from '@/stores/useProductSettingsStore'

const COMING_SOON = [
  { icon: Bell, title: 'Notifications', detail: 'macOS alerts when a workload fails or a pod starts crash-looping.' },
  { icon: RefreshCw, title: 'Auto-refresh', detail: 'Configurable polling so lists stay current without a manual refresh.' },
]

export function SettingsDrawer() {
  const open = useSettingsDrawerStore((s) => s.open)
  const setOpen = useSettingsDrawerStore((s) => s.setOpen)
  const currentContext = useClusterStore((s) => s.currentContext)
  const profile = useClusterPrefsStore((s) => (currentContext ? s.profiles[currentContext] ?? 'development' : 'development'))
  const setProfile = useClusterPrefsStore((s) => s.setProfile)
  const telemetryOptIn = useProductSettingsStore((s) => s.telemetryOptIn)
  const setTelemetryOptIn = useProductSettingsStore((s) => s.setTelemetryOptIn)

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
        {currentContext && (
          <div className="rounded-lg border border-border-subtle bg-white/[0.02] p-3">
            <div className="flex gap-3">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-fg-subtle" strokeWidth={1.75} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-fg">Cluster protection</p>
                <p className="mt-0.5 text-xs leading-relaxed text-fg-muted">Classify the active context locally. Production adds a clear warning before destructive actions.</p>
                <select aria-label="Cluster environment" value={profile} onChange={(event) => setProfile(currentContext, event.target.value as 'production' | 'staging' | 'development')} className="kp-control mt-3 w-full">
                  <option value="development">Development</option>
                  <option value="staging">Staging</option>
                  <option value="production">Production</option>
                </select>
              </div>
            </div>
          </div>
        )}
        <label className="flex cursor-pointer gap-3 rounded-lg border border-border-subtle bg-white/[0.02] p-3">
          <input type="checkbox" checked={telemetryOptIn} onChange={(event) => setTelemetryOptIn(event.target.checked)} className="mt-0.5" />
          <span><span className="text-sm font-medium text-fg">Share anonymous product telemetry</span><span className="mt-0.5 block text-xs leading-relaxed text-fg-muted">Optional and local by default. KubePilot never sends kubeconfig, resource names, labels, YAML, logs, commands, Secrets, or IP addresses.</span></span>
        </label>
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
