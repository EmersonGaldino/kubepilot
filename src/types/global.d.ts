import type { KubepilotApi } from '@shared/ipc-contract'

declare global {
  interface Window {
    /** Exposed by `electron/preload.ts` via `contextBridge`. The renderer has
     * no other route into the main process or Node.js. */
    kubepilot: KubepilotApi
  }

  /** Injected by `vite.config.ts`'s `define` from `package.json`'s version at
   * build time — backs the About dialog's version line. */
  const __APP_VERSION__: string
}

export {}
