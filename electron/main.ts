import { createHash } from 'node:crypto'
import path from 'node:path'
import { writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'

import { app, BrowserWindow, dialog, ipcMain } from 'electron'
import fixPath from 'fix-path'

import { IPC_CHANNELS } from '../shared/ipc-contract'
import { registerIpcHandlers } from './ipc'
import { createServiceContainer } from './services'
import { createTray, type TrayController } from './tray'
import { createMainWindow, hideInsteadOfClose, revealWindowControls } from './window'

function bootLog(message: string): void {
  try {
    writeFileSync(path.join(tmpdir(), 'kubepilot-boot.log'), `${new Date().toISOString()} ${message}\n`, { flag: 'a' })
  } catch {
    // Boot diagnostics must never take the app down.
  }
}

// KubePilot's source is public, but running it isn't — see LICENSE.
// `__BUILD_KEY__` is baked in at build time (vite.config.ts's `define`)
// from `OFFICIAL_BUILD_KEY`, a value that only the release CI (as a GitHub
// Actions secret) and authorized maintainers (in an untracked `.env.local`)
// have; the hash below is safe to publish since it can't be reversed back
// into the key. This is a speed bump, not real protection — anyone willing
// to read and delete this block can bypass it — its purpose is only to
// make a plain `git clone && npm run dev`/`npm run build` refuse to start
// instead of silently producing a fully working unauthorized copy.
const EXPECTED_BUILD_KEY_HASH = 'b7fa8bda16430d4c2e39528e09ad4c83b13a05f9c0ac04f52268cc52bb366923'

function isOfficialBuild(): boolean {
  if (!__BUILD_KEY__) return false
  return createHash('sha256').update(__BUILD_KEY__).digest('hex') === EXPECTED_BUILD_KEY_HASH
}

function refuseUnofficialBuild(): void {
  bootLog('quit: unofficial build (missing/invalid OFFICIAL_BUILD_KEY)')
  void app.whenReady().then(() => {
    dialog.showErrorBox(
      'Unofficial KubePilot build',
      'This build was not produced by the official KubePilot release pipeline and cannot run.\n\n' +
        'Download an official installer from the Releases page, or contact the maintainer for access to build from source.',
    )
    app.exit(1)
  })
}

function startApp(): void {
  // GUI-launched macOS/Linux apps (Finder, Dock, Spotlight) start with launchd's
  // minimal PATH, not the user's login-shell PATH. That's invisible for calls to
  // the Kubernetes API itself (plain HTTPS), but it breaks kubeconfig `exec`
  // auth plugins — e.g. `kubelogin` for AKS — which @kubernetes/client-node
  // spawns by bare command name. `npm run dev` never hit this because it runs
  // as a child of an interactive shell that already has the full PATH.
  try {
    fixPath()
    bootLog(`fixPath applied PATH=${process.env.PATH ?? ''}`)
  } catch (error) {
    bootLog(`fixPath failed ${error instanceof Error ? (error.stack ?? error.message) : String(error)}`)
  }

  process.on('uncaughtException', (error) => {
    bootLog(`uncaughtException ${error.stack ?? error.message}`)
  })
  process.on('unhandledRejection', (reason) => {
    bootLog(`unhandledRejection ${reason instanceof Error ? (reason.stack ?? reason.message) : String(reason)}`)
  })

  // KubePilot is a menu-bar-first app: a single hidden-not-destroyed window
  // plus a Tray icon. Running twice would just fight over the same kubeconfig
  // watcher and spawn a second tray icon, so we enforce a single instance.
  const gotLock = app.requestSingleInstanceLock()
  bootLog(`start packaged=${String(app.isPackaged)} lock=${String(gotLock)}`)
  if (!gotLock) {
    bootLog('quit: second instance')
    app.quit()
  }

  let mainWindow: BrowserWindow | null = null
  let tray: TrayController | null = null
  let isQuitting = false

  const services = createServiceContainer()

  app.on('second-instance', () => {
    mainWindow?.show()
    mainWindow?.focus()
  })

  app.on('before-quit', () => {
    isQuitting = true
    services.logsService.stopAll()
    services.execService.stopAll()
    void services.portForwardService.stopAll()
    services.clusterService.dispose()
    tray?.destroy()
  })

  app.whenReady().then(() => {
    bootLog('whenReady')
    if (process.platform === 'darwin') {
      // Packaged builds use the .icns in Contents/Resources; `npm run dev`
      // has no bundle icon, so we load the PNG from the repo.
      const dockIcon = app.isPackaged
        ? path.join(process.resourcesPath, 'icon.icns')
        : path.join(app.getAppPath(), 'public', 'app-icon.png')
      try {
        app.dock?.setIcon(dockIcon)
      } catch (error) {
        bootLog(`setIcon failed ${error instanceof Error ? error.message : String(error)}`)
      }
    }

    services.clusterService.init()

    // Fire-and-forget: failures just mean no "update available" toast this
    // round — never worth blocking startup or surfacing a boot error over.
    void services.updateService.checkForUpdates().catch((error) => {
      bootLog(`update check failed ${error instanceof Error ? error.message : String(error)}`)
    })
    // Re-check periodically for an app that's typically left running for
    // days as a menu-bar resident rather than relaunched daily.
    setInterval(() => {
      void services.updateService.checkForUpdates().catch(() => {
        // Already logged by the initial check's handler pattern; a recurring
        // failure (e.g. offline) shouldn't spam the boot log every 4 hours.
      })
    }, 4 * 60 * 60 * 1000)

    try {
      mainWindow = createMainWindow()
      hideInsteadOfClose(mainWindow, () => isQuitting)
      registerIpcHandlers(services, () => mainWindow)
      ipcMain.on(IPC_CHANNELS.window.splashDone, () => {
        if (mainWindow) revealWindowControls(mainWindow)
      })
    } catch (error) {
      bootLog(`createWindow failed ${error instanceof Error ? (error.stack ?? error.message) : String(error)}`)
      throw error
    }

    try {
      tray = createTray(services, () => mainWindow, () => {
        isQuitting = true
        app.quit()
      })
    } catch (error) {
      bootLog(`createTray failed ${error instanceof Error ? (error.stack ?? error.message) : String(error)}`)
    }

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        mainWindow = createMainWindow()
        hideInsteadOfClose(mainWindow, () => isQuitting)
      } else {
        mainWindow?.show()
        mainWindow?.focus()
      }
    })
  }).catch((error) => {
    bootLog(`whenReady failed ${error instanceof Error ? (error.stack ?? error.message) : String(error)}`)
  })

  // Standard macOS convention: menu-bar apps in particular should never quit
  // just because their window closed — the Tray icon is still the app.
  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit()
  })
}

if (isOfficialBuild()) {
  startApp()
} else {
  refuseUnofficialBuild()
}
