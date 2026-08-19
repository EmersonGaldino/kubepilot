import { X } from 'lucide-react'
import type { ReactNode } from 'react'

import { useEscapeKey } from '@/hooks/useEscapeKey'

import { IconButton } from './IconButton'

export function Drawer({
  title,
  subtitle,
  onClose,
  children,
  footer,
}: {
  title: string
  subtitle?: string
  onClose: () => void
  children: ReactNode
  footer?: ReactNode
}) {
  useEscapeKey(onClose)

  return (
    <div className="kp-scrim" onClick={onClose} role="presentation">
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="kp-drawer-title"
        className="kp-drawer"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="flex shrink-0 items-start justify-between gap-3 border-b border-border-subtle px-5 py-3.5">
          <div className="min-w-0">
            <h2 id="kp-drawer-title" className="truncate text-sm font-semibold text-fg">
              {title}
            </h2>
            {subtitle && <p className="mt-0.5 truncate text-xs text-fg-muted">{subtitle}</p>}
          </div>
          <IconButton label="Close details" onClick={onClose}>
            <X className="h-4 w-4" />
          </IconButton>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">{children}</div>
        {footer && (
          <footer className="flex shrink-0 flex-wrap items-center gap-2 border-t border-border-subtle bg-surface-1 px-5 py-3">
            {footer}
          </footer>
        )}
      </aside>
    </div>
  )
}
