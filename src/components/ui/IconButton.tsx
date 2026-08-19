import clsx from 'clsx'
import type { ButtonHTMLAttributes, ReactNode } from 'react'

export function IconButton({
  label,
  children,
  className,
  type = 'button',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  label: string
  children: ReactNode
}) {
  return (
    <button
      type={type}
      aria-label={label}
      title={props.title ?? label}
      className={clsx(
        'inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-fg-muted transition-colors duration-150 hover:bg-white/[0.06] hover:text-fg disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  )
}
