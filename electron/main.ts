import path from 'node:path'
import { writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'

import { app, BrowserWindow, ipcMain } from 'electron'
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
