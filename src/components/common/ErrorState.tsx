import { AlertTriangle, RotateCw } from 'lucide-react'

import { Button } from '@/components/ui/Button'

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 py-16 text-center" role="alert">
      <div className="rounded-full bg-red-500/10 p-3">
        <AlertTriangle className="h-6 w-6 text-danger" strokeWidth={1.5} />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-medium text-fg">Something went wrong</p>
        <p className="max-w-md text-sm leading-relaxed text-fg-muted">{message}</p>
      </div>
      {onRetry && (
        <Button variant="secondary" onClick={onRetry} className="mt-1">
          <RotateCw className="h-3.5 w-3.5" />
          Retry
        </Button>
      )}
    </div>
  )
}
