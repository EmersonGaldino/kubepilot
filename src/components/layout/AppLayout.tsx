import { useEffect, useState } from 'react'
import { Outlet } from 'react-router-dom'

import { SplashScreen } from '@/components/splash/SplashScreen'
import { useKubepilotBootstrap } from '@/hooks/useKubepilotBootstrap'
import { useSplashGate } from '@/hooks/useSplashGate'
import { useTrayNavigation } from '@/hooks/useTrayNavigation'

import { AboutDialog } from './AboutDialog'
import { SettingsDrawer } from './SettingsDrawer'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'

// Minimum time the splash stays up even if the kubeconfig read finishes
// sooner — long enough to register as a deliberate loading screen, short
// enough not to feel like it's stalling a fast local startup.
const SPLASH_MIN_MS = 2800
// Must match SplashScreen's `duration-500` fade so the component only
// unmounts once its opacity transition has actually finished playing.
const SPLASH_FADE_MS = 500

export function AppLayout() {
  useKubepilotBootstrap()
  useTrayNavigation()

  const [aboutOpen, setAboutOpen] = useState(false)

  const splashReady = useSplashGate(SPLASH_MIN_MS)
  const [splashMounted, setSplashMounted] = useState(true)

  useEffect(() => {
    if (!splashReady) return
    const timer = setTimeout(() => setSplashMounted(false), SPLASH_FADE_MS)
    return () => clearTimeout(timer)
  }, [splashReady])

  return (
    <div className="relative flex h-screen flex-col bg-surface-0 text-fg">
      {/* Reserves space for the macOS traffic lights (see
       * `trafficLightPosition` in electron/window.ts) so they never overlap
       * app content, and lets the window be dragged from this strip. The
       * icon/name sit on the right instead, out of the traffic lights' way. */}
      <div className="drag-region flex h-10 shrink-0 items-center justify-end border-b border-border-subtle bg-surface-1 pl-20 pr-3">
        <button
          type="button"
          onClick={() => setAboutOpen(true)}
          className="no-drag flex items-center gap-2 rounded-md px-2 py-1 transition-colors duration-150 hover:bg-white/[0.06]"
          title="About KubePilot"
        >
          <img src="/app-icon.png" alt="" className="h-5 w-5 rounded-md" />
          <span className="text-sm font-semibold tracking-tight text-fg">KubePilot</span>
        </button>
      </div>

      {aboutOpen && <AboutDialog onClose={() => setAboutOpen(false)} />}
      <SettingsDrawer />

      <div className="flex min-h-0 flex-1">
        <Sidebar />
        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <Topbar />
          <main className="flex min-h-0 flex-1 flex-col overflow-hidden">
            <Outlet />
          </main>
        </div>
      </div>

      {splashMounted && <SplashScreen fadingOut={splashReady} />}
    </div>
  )
}
