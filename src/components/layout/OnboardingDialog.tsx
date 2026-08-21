import { CheckCircle2, Compass, ShieldCheck } from 'lucide-react'

import { Button } from '@/components/ui/Button'
import { useProductSettingsStore } from '@/stores/useProductSettingsStore'

export function OnboardingDialog() {
  const complete = useProductSettingsStore((state) => state.completeOnboarding)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-5">
      <div role="dialog" aria-modal="true" aria-labelledby="onboarding-title" className="w-full max-w-xl rounded-2xl border border-accent/25 bg-surface-1 p-6 shadow-panel">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent-hover">Welcome to KubePilot</p>
        <h2 id="onboarding-title" className="mt-2 text-xl font-semibold tracking-tight text-fg">Diagnose Kubernetes incidents without losing context.</h2>
        <p className="mt-2 text-sm leading-relaxed text-fg-muted">KubePilot reads your existing kubeconfig locally. It never changes the active context in your file and never uploads your cluster data.</p>
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <Step icon={Compass} title="Choose context" detail="Switch clusters and namespaces from the app, without editing kubeconfig." />
          <Step icon={ShieldCheck} title="Protect production" detail="Classify sensitive clusters in Settings for clearer context and safer actions." />
          <Step icon={CheckCircle2} title="Investigate faster" detail="Keep logs, terminals, YAML and forwards together in the Workspace shelf." />
        </div>
        <div className="mt-6 flex justify-end">
          <Button variant="primary" onClick={complete}>Open dashboard</Button>
        </div>
      </div>
    </div>
  )
}

function Step({ icon: Icon, title, detail }: { icon: typeof Compass; title: string; detail: string }) {
  return <div className="rounded-xl border border-border-subtle bg-white/[0.02] p-3"><Icon className="h-4 w-4 text-accent-hover" /><p className="mt-2 text-sm font-medium text-fg">{title}</p><p className="mt-1 text-xs leading-relaxed text-fg-muted">{detail}</p></div>
}
