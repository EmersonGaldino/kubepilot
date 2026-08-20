
import path from 'node:path'

import { app, Menu, nativeImage, Tray, type BrowserWindow } from 'electron'

import { IPC_CHANNELS } from '../../shared/ipc-contract'
import type { ConnectionStatus } from '../../shared/types'
import type { ServiceContainer } from '../services'

// Full-color emoji dots for the dropdown menu, where a splash of color reads
// as informative rather than noisy.
const STATUS_GLYPH: Record<ConnectionStatus, string> = {
  connected: '🟢',
  connecting: '🟡',
  disconnected: '⚪️',
  error: '🔴',
}

// What actually sits next to the icon in the menu bar strip, though — that's
// prime real estate beside the system clock, and a big colored ball there
// reads as a badge/notification rather than a status hint. Plain text
// glyphs (with the U+FE0E variation selector forcing the monochrome "text"
// presentation instead of emoji-style color) keep it quiet: nothing at all
// for the common "everything's fine" state, and a small mark only when
// something actually needs attention — the same restraint macOS's own menu
// bar extras (Wi-Fi, Bluetooth, Focus) use.
const STATUS_TITLE: Record<ConnectionStatus, string> = {
  connected: '',
  connecting: '…', // …
  disconnected: '',
  error: '⚠︎', // ⚠ (text presentation)
}

const STATUS_TOOLTIP: Record<ConnectionStatus, string> = {
  connected: 'KubePilot — Connected',
  connecting: 'KubePilot — Connecting…',
  disconnected: 'KubePilot',
  error: 'KubePilot — Connection error',
}

function resolveTrayIconPath(): string {
  // Packaged: extraResources copies the PNGs next to the .app resources so
  // nativeImage does not have to read them out of the asar. Dev: repo `build/`.
  if (app.isPackaged) {
    return path.join(process.resourcesPath, 'trayTemplate.png')
  }
  return path.join(app.getAppPath(), 'build', 'trayTemplate.png')
}

export interface TrayController {
  tray: Tray
  refresh: () => Promise<void>
  destroy: () => void
}

export function createTray(
  services: ServiceContainer,
  getWindow: () => BrowserWindow | null,
  onQuit: () => void,
): TrayController {
  const icon = nativeImage.createFromPath(resolveTrayIconPath())
  icon.setTemplateImage(true)

  const tray = new Tray(icon)
  tray.setToolTip('KubePilot')

  const openWindow = () => {
    const window = getWindow()
    if (!window) return
    window.show()
    window.focus()
  }

  const navigate = (route: string) => {
    openWindow()
    getWindow()?.webContents.send(IPC_CHANNELS.tray.navigate, route)
  }

  async function refresh(): Promise<void> {
    const { contexts, currentContext } = services.clusterService.getContextsSnapshot()

    let status: ConnectionStatus = 'disconnected'
    let clusterLabel = 'No cluster selected'
    let podsLine = ''
    let namespacesLine = ''

    if (currentContext) {
      clusterLabel = currentContext
      try {
        // The version check alone decides `status` — namespaces/pods are
        // fetched independently below so a user without cluster-wide list
        // permissions on one of them doesn't make the tray report the
        // whole cluster as errored.
        const info = await services.clusterService.getClusterInfo()
        status = info.status
      } catch {
        status = 'error'
      }

      const [namespaces, pods] = await Promise.all([
        services.namespaceService.list().catch(() => null),
        services.podService.list({ namespace: 'all' }).catch(() => null),
      ])
      if (namespaces) namespacesLine = `Namespaces   ${namespaces.length}`
      if (pods) podsLine = `Pods         ${pods.length}`
    }

    tray.setTitle(STATUS_TITLE[status])
    tray.setToolTip(STATUS_TOOLTIP[status])

    const contextItems: Electron.MenuItemConstructorOptions[] = contexts.map((ctx) => ({
      label: `${ctx.isCurrent ? '●' : '○'} ${ctx.name}`,
      type: 'normal',
      click: async () => {
        try {
          await services.clusterService.setActiveContext(ctx.name)
        } finally {
          void refresh()
        }
      },
    }))

    const menu = Menu.buildFromTemplate([
      { label: `${STATUS_GLYPH[status]} ${status[0]?.toUpperCase()}${status.slice(1)}`, enabled: false },
      { label: `Cluster: ${clusterLabel}`, enabled: false },
      ...(namespacesLine ? [{ label: namespacesLine, enabled: false }] : []),
      ...(podsLine ? [{ label: podsLine, enabled: false }] : []),
      { type: 'separator' },
      { label: 'Open KubePilot', click: openWindow },
      { label: 'Change Cluster', submenu: contextItems.length > 0 ? contextItems : [{ label: 'No contexts found', enabled: false }] },
      { label: 'Refresh', click: () => navigate('refresh') },
      { label: 'Settings', click: () => navigate('/settings') },
      { type: 'separator' },
      { label: 'Quit', click: onQuit },
    ])

    tray.setContextMenu(menu)
  }

  tray.on('click', openWindow)

  void refresh()
  services.clusterService.on('changed', () => void refresh())

  return {
    tray,
    refresh,
    destroy: () => tray.destroy(),
  }
}
