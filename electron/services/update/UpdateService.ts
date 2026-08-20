import { EventEmitter } from 'node:events'

import { app } from 'electron'
import { autoUpdater, type UpdateInfo } from 'electron-updater'

export interface UpdateProgress {
  percent: number
  bytesPerSecond: number
  transferred: number
  total: number
}

export interface UpdateCheckResult {
  updateAvailable: boolean
  version: string | null
}

/**
 * Thin wrapper around `electron-updater`'s `autoUpdater` singleton.
 *
 * Policy: check silently on launch (and every few hours while running), but
 * never install anything without the user's say — downloading and
 * installing are both explicit actions the renderer triggers after showing
 * a "new version available" prompt. `autoDownload`/`autoInstallOnAppQuit`
 * stay off so a background download never surprises someone mid-`kubectl
 * exec` session by relaunching the app.
 */
export class UpdateService extends EventEmitter {
  private checking = false
  private latestVersion: string | null = null

  constructor() {
    super()
    autoUpdater.autoDownload = false
    autoUpdater.autoInstallOnAppQuit = false

    autoUpdater.on('update-available', (info: UpdateInfo) => {
      this.latestVersion = info.version
      this.emit('available', info.version)
    })
    autoUpdater.on('update-not-available', () => {
      this.latestVersion = null
      this.emit('not-available')
    })
    autoUpdater.on('download-progress', (progress) => {
      this.emit('progress', {
        percent: progress.percent,
        bytesPerSecond: progress.bytesPerSecond,
        transferred: progress.transferred,
        total: progress.total,
      } satisfies UpdateProgress)
    })
    autoUpdater.on('update-downloaded', (info: UpdateInfo) => {
      this.latestVersion = info.version
      this.emit('downloaded', info.version)
    })
    autoUpdater.on('error', (error) => {
      this.emit('error', error instanceof Error ? error.message : String(error))
    })
  }

  /** No-op outside a packaged build — `electron-updater` has nothing to
   * compare against (no app-update.yml) when running via `npm run dev`. */
  private get isSupported(): boolean {
    return app.isPackaged
  }

  async checkForUpdates(): Promise<UpdateCheckResult> {
    if (!this.isSupported || this.checking) {
      return { updateAvailable: false, version: this.latestVersion }
    }
    this.checking = true
    try {
      const result = await autoUpdater.checkForUpdates()
      const version = result?.updateInfo.version ?? null
      const updateAvailable = version !== null && version !== app.getVersion()
      if (updateAvailable) this.latestVersion = version
      return { updateAvailable, version: updateAvailable ? version : null }
    } finally {
      this.checking = false
    }
  }

  async downloadUpdate(): Promise<void> {
    if (!this.isSupported) return
    await autoUpdater.downloadUpdate()
  }

  /** Quits and relaunches into the downloaded version. Caller is
   * responsible for having warned the user first — this does not prompt. */
  quitAndInstall(): void {
    if (!this.isSupported) return
    autoUpdater.quitAndInstall()
  }
}
