import clsx from 'clsx'
import { useEffect, useState } from 'react'

import { APP_ICON_URL } from '@/lib/appIcon'

// Rotates through phrases that are all honestly describing the same
// kubeconfig read (see `useKubepilotBootstrap`) — not fake progress steps,
// just enough movement that the wait doesn't feel frozen.
const STATUS_PHRASES = ['Reading kubeconfig…', 'Discovering clusters…', 'Preparing your cockpit…']
const STATUS_INTERVAL_MS = 1600

/** Full-screen loading overlay shown while the app reads the kubeconfig on
 * startup (gated by {@link useSplashGate}): a quiet "control plane" motif —
 * drifting aurora blobs behind a faint dot-grid, an orbit halo breathing
 * around the mark, and a slim gradient progress sweep with rotating status
 * text. `fadingOut` starts the opacity transition; the caller unmounts this
 * once that transition finishes. */
export function SplashScreen({ fadingOut }: { fadingOut: boolean }) {
  const [phraseIndex, setPhraseIndex] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setPhraseIndex((i) => (i + 1) % STATUS_PHRASES.length)
    }, STATUS_INTERVAL_MS)
    return () => clearInterval(timer)
  }, [])

  return (
    <div
      className={clsx(
        'absolute inset-0 z-50 flex flex-col items-center justify-center overflow-hidden bg-surface-0 transition-opacity duration-500',
        fadingOut ? 'pointer-events-none opacity-0' : 'opacity-100',
      )}
    >
      <div className="splash-grid absolute inset-0" />
      <div
        className="splash-aurora animate-splash-aurora h-[26rem] w-[26rem]"
        style={{ top: '8%', left: '4%', background: 'radial-gradient(circle, #3b82f6, transparent 70%)' }}
      />
      <div
        className="splash-aurora animate-splash-aurora h-[22rem] w-[22rem]"
        style={{ bottom: '4%', right: '2%', background: 'radial-gradient(circle, #34d399, transparent 70%)', animationDelay: '-7s' }}
      />

      <div className="relative z-10 flex flex-col items-center gap-4">
        <div className="relative flex h-24 w-24 items-center justify-center">
          <div className="splash-icon-glow animate-splash-glow" />
          <div className="animate-splash-orbit splash-orbit-ring absolute inset-0" />
          <div className="animate-splash-orbit-reverse splash-orbit-ring absolute inset-2 opacity-50" />
          <img src={APP_ICON_URL} alt="" className="relative h-14 w-14 rounded-2xl shadow-2xl" />
        </div>

        <div className="flex flex-col items-center gap-1">
          <span className="text-lg font-semibold tracking-tight text-fg">KubePilot</span>
          <span className="text-xs text-fg-subtle">Your clusters, one cockpit</span>
        </div>
      </div>

      <div className="absolute bottom-14 flex flex-col items-center gap-2.5">
        <div className="h-1 w-56 overflow-hidden rounded-full bg-white/10">
          <div className="h-full w-1/3 rounded-full bg-gradient-to-r from-blue-500 via-emerald-400 to-amber-400 animate-splash-loading-bar" />
        </div>
        <span key={phraseIndex} className="animate-splash-text-fade text-xs text-fg-muted">
          {STATUS_PHRASES[phraseIndex]}
        </span>
      </div>
    </div>
  )
}
