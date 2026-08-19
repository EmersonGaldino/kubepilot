import type { KeyboardEvent, ReactNode } from 'react'

export function SelectableRow({
  onSelect,
  children,
}: {
  onSelect: () => void
  children: ReactNode
}) {
  const handleKeyDown = (event: KeyboardEvent<HTMLTableRowElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      onSelect()
    }
  }

  return (
    <tr tabIndex={0} onClick={onSelect} onKeyDown={handleKeyDown} className="kp-row">
      {children}
    </tr>
  )
}
