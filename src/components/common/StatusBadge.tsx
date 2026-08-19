import clsx from 'clsx'

import type { ConnectionStatus, PodPhase, WorkloadStatus } from '@shared/types'

const CONNECTION_STYLES: Record<ConnectionStatus, string> = {
  connected: 'bg-emerald-500/15 text-emerald-300 ring-emerald-500/30',
  connecting: 'bg-amber-500/15 text-amber-300 ring-amber-500/30',
  disconnected: 'bg-white/5 text-fg-muted ring-white/10',
  error: 'bg-red-500/15 text-red-300 ring-red-500/30',
}

const CONNECTION_LABEL: Record<ConnectionStatus, string> = {
  connected: 'Connected',
  connecting: 'Connecting',
  disconnected: 'Disconnected',
  error: 'Error',
}

const CONNECTION_DOT: Record<ConnectionStatus, string> = {
  connected: 'bg-success',
  connecting: 'bg-warning',
  disconnected: 'bg-fg-subtle',
  error: 'bg-danger',
}

export function ConnectionStatusBadge({ status }: { status: ConnectionStatus }) {
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset',
        CONNECTION_STYLES[status],
      )}
    >
      <span className={clsx('h-1.5 w-1.5 rounded-full', CONNECTION_DOT[status], status === 'connecting' && 'animate-pulse')} />
      {CONNECTION_LABEL[status]}
    </span>
  )
}

const PHASE_STYLES: Record<PodPhase, string> = {
  Running: 'bg-emerald-500/15 text-emerald-300 ring-emerald-500/30',
  Pending: 'bg-amber-500/15 text-amber-300 ring-amber-500/30',
  Succeeded: 'bg-blue-500/15 text-blue-300 ring-blue-500/30',
  Failed: 'bg-red-500/15 text-red-300 ring-red-500/30',
  Unknown: 'bg-white/5 text-fg-muted ring-white/10',
}

export function PodPhaseBadge({ phase }: { phase: PodPhase }) {
  return (
    <span className={clsx('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset', PHASE_STYLES[phase])}>
      {phase}
    </span>
  )
}

const WORKLOAD_STYLES: Record<WorkloadStatus, string> = {
  Available: 'bg-emerald-500/15 text-emerald-300 ring-emerald-500/30',
  Updating: 'bg-amber-500/15 text-amber-300 ring-amber-500/30',
  Unavailable: 'bg-red-500/15 text-red-300 ring-red-500/30',
  ScaledToZero: 'bg-white/5 text-fg-muted ring-white/10',
}

const WORKLOAD_LABEL: Record<WorkloadStatus, string> = {
  Available: 'Available',
  Updating: 'Updating',
  Unavailable: 'Unavailable',
  ScaledToZero: 'Scaled to zero',
}

export function WorkloadStatusBadge({ status }: { status: WorkloadStatus }) {
  return (
    <span className={clsx('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset', WORKLOAD_STYLES[status])}>
      {WORKLOAD_LABEL[status]}
    </span>
  )
}
