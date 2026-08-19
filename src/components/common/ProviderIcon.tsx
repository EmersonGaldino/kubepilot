import { Cpu, Laptop } from 'lucide-react'

import type { ClusterProvider } from '@shared/types'

const BADGE = 'h-4 w-4 shrink-0 rounded'

/** A quick color/shape cue evoking each cloud's brand (Google's four
 * colors, Azure blue, AWS orange) — not a pixel-accurate reproduction of
 * any logo, just enough to tell GKE/AKS/EKS/local clusters apart at a
 * glance in the Sidebar's cluster cards. */
function GoogleMark() {
  return (
    <svg viewBox="0 0 16 16" className={BADGE} aria-hidden="true">
      <rect x="0" y="0" width="7" height="7" rx="1.5" fill="#4285F4" />
      <rect x="9" y="0" width="7" height="7" rx="1.5" fill="#EA4335" />
      <rect x="0" y="9" width="7" height="7" rx="1.5" fill="#34A853" />
      <rect x="9" y="9" width="7" height="7" rx="1.5" fill="#FBBC05" />
    </svg>
  )
}

function AzureMark() {
  return (
    <svg viewBox="0 0 16 16" className={BADGE} aria-hidden="true">
      <rect width="16" height="16" rx="3" fill="#0078D4" />
      <path d="M6 3.5 2.5 12.5h3.7L8.6 6.4l2.4 6.1H13.5L9 3.5Z" fill="white" />
    </svg>
  )
}

function AwsMark() {
  return (
    <svg viewBox="0 0 16 16" className={BADGE} aria-hidden="true">
      <rect width="16" height="16" rx="3" fill="#FF9900" />
      <path d="M3 10c3 2 7 2 10 0" stroke="white" strokeWidth="1.4" fill="none" strokeLinecap="round" />
      <path d="M11.6 8.7 13 10l-1.7.5" stroke="white" strokeWidth="1.2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function ProviderIcon({ provider }: { provider: ClusterProvider }) {
  switch (provider) {
    case 'gke':
      return <GoogleMark />
    case 'aks':
      return <AzureMark />
    case 'eks':
      return <AwsMark />
    case 'local':
      return (
        <span className={`${BADGE} flex items-center justify-center bg-zinc-500/20 text-zinc-400`}>
          <Laptop className="h-3 w-3" strokeWidth={2} />
        </span>
      )
    default:
      return (
        <span className={`${BADGE} flex items-center justify-center bg-zinc-500/20 text-zinc-500`}>
          <Cpu className="h-3 w-3" strokeWidth={2} />
        </span>
      )
  }
}
