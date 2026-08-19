import clsx from 'clsx'
import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

export function StatCard({
  label,
  value,
  icon: Icon,
  tone = 'default',
  breakdown,
  disabled,
  to,
}: {
  label: string
  value: string | number
  icon: LucideIcon
  tone?: 'default' | 'warning' | 'danger'
  breakdown?: { label: string; value: number; tone?: 'default' | 'warning' | 'danger' }[]
  disabled?: boolean
  to?: string
}) {
  const body = (
    <>
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-fg-muted">{label}</span>
        <Icon className="h-4 w-4 text-fg-subtle" strokeWidth={1.75} />
      </div>
      <p
        className={clsx(
          'mt-2 text-2xl font-semibold tabular-nums tracking-tight',
          tone === 'warning' && 'text-warning',
          tone === 'danger' && 'text-danger',
          tone === 'default' && 'text-fg',
        )}
      >
        {value}
      </p>
      {breakdown && breakdown.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-3 border-t border-border-subtle pt-2">
          {breakdown.map((b) => (
            <span key={b.label} className="text-xs">
              <span
                className={clsx(
                  'font-medium tabular-nums',
                  b.tone === 'warning' && 'text-warning',
                  b.tone === 'danger' && 'text-danger',
                  (!b.tone || b.tone === 'default') && 'text-fg',
                )}
              >
                {b.value}
              </span>{' '}
              <span className="text-fg-subtle">{b.label}</span>
            </span>
          ))}
        </div>
      )}
      {disabled && <p className="mt-3 text-[11px] font-medium text-fg-subtle">Coming in Phase 2</p>}
    </>
  )

  const className = clsx(
    'kp-card p-4 transition-colors duration-150',
    disabled && 'opacity-50',
    to && 'hover:border-accent/30 hover:bg-surface-3',
  )

  if (to && !disabled) {
    return (
      <Link to={to} className={clsx(className, 'block')}>
        {body}
      </Link>
    )
  }

  return <div className={className}>{body}</div>
}

export function StatCardGrid({ children }: { children: ReactNode }) {
  return <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">{children}</section>
}
