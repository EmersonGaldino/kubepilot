import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon
  title: string
  description?: string
  action?: ReactNode
}) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 py-16 text-center">
      <div className="rounded-full bg-white/[0.04] p-3">
        <Icon className="h-6 w-6 text-fg-muted" strokeWidth={1.5} />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-medium text-fg">{title}</p>
        {description && <p className="max-w-sm text-sm leading-relaxed text-fg-muted">{description}</p>}
      </div>
      {action}
    </div>
  )
}
