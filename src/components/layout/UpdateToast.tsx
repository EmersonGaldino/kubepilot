import { Download, RefreshCw, Sparkles, X } from 'lucide-react'

import { Button } from '@/components/ui/Button'
import { IconButton } from '@/components/ui/IconButton'
import { useAppUpdate } from '@/hooks/useAppUpdate'

/** Bottom-right toast that carries the app's whole update policy: check
 * happens silently in the main process, but downloading and restarting are
 * always the user's call — nothing here installs itself without a click. */
export function UpdateToast() {
  const { state, download, install, dismiss } = useAppUpdate()

  if (state.stage === 'idle') return null

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-4 right-4 z-50 w-80 rounded-xl border border-border-subtle bg-surface-1 p-4 shadow-panel"
    >
      <div className="flex items-start gap-3">
        <div className="shrink-0 rounded-full bg-accent/15 p-2">
          {state.stage === 'downloaded' ? (
            <RefreshCw className="h-4 w-4 text-blue-300" strokeWidth={1.5} />
          ) : (
            <Sparkles className="h-4 w-4 text-blue-300" strokeWidth={1.5} />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-fg">
            {state.stage === 'error' ? 'Update failed' : state.stage === 'downloaded' ? 'Update ready' : 'New version available'}
          </p>
          <p className="mt-1 text-xs leading-relaxed text-fg-muted">
            {state.stage === 'error' && (state.error ?? 'Something went wrong downloading the update.')}
            {state.stage === 'available' && `KubePilot ${state.version} is ready to download.`}
            {state.stage === 'downloading' && `Downloading KubePilot ${state.version}… ${Math.round(state.percent)}%`}
            {state.stage === 'downloaded' && `KubePilot ${state.version} downloaded. Restart to finish installing.`}
          </p>
        </div>
        <IconButton label="Dismiss" onClick={dismiss} className="shrink-0">
          <X className="h-3.5 w-3.5" />
        </IconButton>
      </div>

      <div className="mt-3 flex justify-end gap-2">
        {state.stage === 'available' && (
          <Button variant="primary" onClick={download}>
            <Download className="h-3.5 w-3.5" strokeWidth={1.5} />
            Download
          </Button>
        )}
        {state.stage === 'downloaded' && (
          <Button variant="primary" onClick={install}>
            <RefreshCw className="h-3.5 w-3.5" strokeWidth={1.5} />
            Restart &amp; install
          </Button>
        )}
        {state.stage === 'error' && (
          <Button variant="secondary" onClick={download}>
            Retry
          </Button>
        )}
      </div>
    </div>
  )
}
