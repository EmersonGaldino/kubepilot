import { X } from 'lucide-react'

import { IconButton } from '@/components/ui/IconButton'
import { APP_ICON_URL } from '@/lib/appIcon'
import { useEscapeKey } from '@/hooks/useEscapeKey'

export function AboutDialog({ onClose }: { onClose: () => void }) {
  useEscapeKey(onClose, true, true)

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="about-title"
        className="relative w-full max-w-xs rounded-xl border border-border-subtle bg-surface-1 p-6 text-center shadow-panel"
        onClick={(e) => e.stopPropagation()}
      >
        <IconButton label="Close" onClick={onClose} className="absolute right-3 top-3">
          <X className="h-4 w-4" />
        </IconButton>

        <img src={APP_ICON_URL} alt="" className="mx-auto h-14 w-14 rounded-xl" />
        <h2 id="about-title" className="mt-3 text-base font-semibold text-fg">
          KubePilot
        </h2>
        <p className="mt-1 text-xs text-fg-muted">Version {__APP_VERSION__}</p>
        <p className="mt-4 text-xs text-fg-subtle">Made by Galdino</p>
      </div>
    </div>
  )
}
