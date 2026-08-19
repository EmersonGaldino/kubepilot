import path from 'node:path'

import { app, BrowserWindow } from 'electron'

import { registerIpcHandlers } from './ipc'
import { createServiceContainer } from './services'
import { createTray, type TrayController } from './tray'
import { createMainWindow, hideInsteadOfClose } from './window'

// KubePilot is a menu-bar-first app: a single hidden-not-destroyed window
// plus a Tray icon. Running twice would just fight over the same kubeconfig
// watcher and spawn a second tray icon, so we enforce a single instance.
if (!app.requestSingleInstanceLock()) {
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
  if (process.platform === 'darwin' && !app.isPackaged) {
    // Give the dev build a real dock icon instead of Electron's default.
    void app.dock?.setIcon(path.join(app.getAppPath(), 'public', 'app-icon.png'))
  }

  services.clusterService.init()

  mainWindow = createMainWindow()
  hideInsteadOfClose(mainWindow, () => isQuitting)

  registerIpcHandlers(services, () => mainWindow)

  tray = createTray(services, () => mainWindow, () => {
    isQuitting = true
    app.quit()
  })

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      mainWindow = createMainWindow()
      hideInsteadOfClose(mainWindow, () => isQuitting)
    } else {
      mainWindow?.show()
      mainWindow?.focus()
    }
  })
})

// Standard macOS convention: menu-bar apps in particular should never quit
// just because their window closed — the Tray icon is still the app.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
