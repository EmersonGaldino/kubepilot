import clsx from 'clsx'
import { Search, X } from 'lucide-react'
import type { InputHTMLAttributes } from 'react'

export function SearchInput({
  value,
  onValueChange,
  className,
  ...props
}: Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> & {
  value: string
  onValueChange: (value: string) => void
}) {
  return (
    <label className={clsx('relative block', className)}>
      <span className="sr-only">{props.placeholder ?? 'Search'}</span>
      <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-fg-subtle" />
      <input
        type="search"
        value={value}
        onChange={(event) => onValueChange(event.target.value)}
        className="h-8 w-full rounded-md border border-border-subtle bg-surface-2 py-0 pl-8 pr-8 text-sm text-fg placeholder:text-fg-subtle transition-colors duration-150 hover:border-border-strong focus:border-accent/50"
        {...props}
      />
      {value && (
        <button
          type="button"
          aria-label="Clear search"
          onClick={() => onValueChange('')}
          className="absolute right-1 top-1/2 inline-flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded text-fg-subtle hover:text-fg"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </label>
  )
}
