import clsx from 'clsx'
import type { CSSProperties } from 'react'

interface CubeProps {
  /** Edge length in pixels. */
  size: number
  /** Tints every face via the `--face-color` custom property the CSS reads. */
  color: string
  /** Absolute position within the splash scene. */
  style: CSSProperties
  reverse?: boolean
  floatDelay?: string
}

/** One tumbling cube: six faces, each just a positioned/rotated square
 * pushed out along Z by half the cube's size — the standard pure-CSS 3D
 * cube technique. `splash-spin`/`splash-spin-reverse` (see `index.css`)
 * rotate the whole scene continuously; `splash-float` layers a slow bob on
 * top so the cubes don't read as mechanically identical. */
function Cube({ size, color, style, reverse, floatDelay }: CubeProps) {
  const half = size / 2
  const faces = [
    `rotateY(0deg) translateZ(${half}px)`,
    `rotateY(90deg) translateZ(${half}px)`,
    `rotateY(180deg) translateZ(${half}px)`,
    `rotateY(-90deg) translateZ(${half}px)`,
    `rotateX(90deg) translateZ(${half}px)`,
    `rotateX(-90deg) translateZ(${half}px)`,
  ]

  return (
    <div className="splash-perspective absolute animate-splash-float" style={{ ...style, animationDelay: floatDelay }}>
      <div
        className={clsx('splash-cube-scene', reverse ? 'animate-splash-spin-reverse' : 'animate-splash-spin')}
        style={{ width: size, height: size, ['--face-color' as string]: color }}
      >
        {faces.map((transform, i) => (
          <div key={i} className="splash-cube-face" style={{ transform }} />
        ))}
      </div>
    </div>
  )
}

/** Full-screen loading overlay shown while the app reads the kubeconfig on
 * startup (gated by {@link useSplashGate}) — tumbling 3D cubes behind the
 * KubePilot mark, with an indeterminate loading bar pinned to the bottom.
 * `fadingOut` starts the opacity transition; the caller unmounts this once
 * that transition finishes. */
export function SplashScreen({ fadingOut }: { fadingOut: boolean }) {
  return (
    <div
      className={clsx(
        'absolute inset-0 z-50 flex flex-col items-center justify-center overflow-hidden bg-surface-0 transition-opacity duration-500',
        fadingOut ? 'pointer-events-none opacity-0' : 'opacity-100',
      )}
    >
      <Cube size={64} color="#3b82f6" style={{ top: '18%', left: '20%' }} />
      <Cube size={40} color="#10b981" style={{ top: '68%', left: '16%' }} reverse floatDelay="-1.5s" />
      <Cube size={52} color="#3b82f6" style={{ top: '24%', right: '18%' }} reverse floatDelay="-3s" />
      <Cube size={30} color="#f59e0b" style={{ top: '70%', right: '22%' }} floatDelay="-4.5s" />
      <Cube size={22} color="#10b981" style={{ top: '46%', right: '32%' }} floatDelay="-2s" />

      <div className="relative z-10 flex flex-col items-center gap-3">
        <img src="/app-icon.png" alt="" className="h-14 w-14 rounded-2xl shadow-2xl" />
        <span className="text-lg font-semibold tracking-tight text-fg">KubePilot</span>
      </div>

      <div className="absolute bottom-14 flex flex-col items-center gap-2">
        <div className="h-1 w-56 overflow-hidden rounded-full bg-white/10">
          <div className="h-full w-1/3 rounded-full bg-gradient-to-r from-blue-500 to-emerald-400 animate-splash-loading-bar" />
        </div>
        <span className="text-xs text-fg-muted">Reading kubeconfig…</span>
      </div>
    </div>
  )
}
