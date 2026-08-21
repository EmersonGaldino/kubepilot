import clsx from 'clsx'
import type { ButtonHTMLAttributes, ReactNode } from 'react'

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'

const VARIANT: Record<ButtonVariant, string> = {
  primary:
    'bg-accent text-white shadow-[0_6px_18px_-8px_rgb(59_130_246_/_0.9)] hover:bg-accent-hover disabled:bg-white/[0.04] disabled:text-fg-subtle',
  secondary: 'bg-white/[0.06] text-fg hover:bg-white/[0.1] disabled:text-fg-subtle',
  ghost: 'text-fg-muted hover:bg-white/[0.06] hover:text-fg',
  danger: 'bg-red-500/15 text-red-300 hover:bg-red-500/25',
}

export function Button({
  variant = 'secondary',
  children,
  className,
  type = 'button',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant
  children: ReactNode
}) {
  return (
    <button
      type={type}
      className={clsx(
        'inline-flex h-8 items-center justify-center gap-1.5 rounded-md px-3 text-xs font-medium transition-[background-color,box-shadow,transform] duration-150 hover:enabled:-translate-y-px disabled:cursor-not-allowed disabled:opacity-50',
        VARIANT[variant],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  )
}
