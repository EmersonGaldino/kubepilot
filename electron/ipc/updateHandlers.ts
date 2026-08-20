import { ipcMain, type BrowserWindow } from 'electron'

import { IPC_CHANNELS } from '../../shared/ipc-contract'
import type { UpdateService } from '../services/update/UpdateService'
import { toIpcResult } from './ipcResult'

/** Wires the check/download/install IPC calls and forwards the updater's
 * background events (available/progress/downloaded/error) to the renderer
 * so it can drive the update toast. */
export function registerUpdateHandlers(updateService: UpdateService, getWindow: () => BrowserWindow | null): void {
  ipcMain.handle(IPC_CHANNELS.update.check, () => toIpcResult(async () => updateService.checkForUpdates()))
  ipcMain.handle(IPC_CHANNELS.update.download, () => toIpcResult(async () => updateService.downloadUpdate()))
  ipcMain.handle(IPC_CHANNELS.update.install, () =>
    toIpcResult(async () => {
      updateService.quitAndInstall()
    }),
  )

  const send = (channel: string, ...args: unknown[]) => {
    const window = getWindow()
    if (!window || window.isDestroyed()) return
    window.webContents.send(channel, ...args)
  }

  updateService.on('available', (version: string) => send(IPC_CHANNELS.update.available, version))
  updateService.on('not-available', () => send(IPC_CHANNELS.update.notAvailable))
  updateService.on('progress', (progress) => send(IPC_CHANNELS.update.progress, progress))
  updateService.on('downloaded', (version: string) => send(IPC_CHANNELS.update.downloaded, version))
  updateService.on('error', (error: string) => send(IPC_CHANNELS.update.error, error))
}
