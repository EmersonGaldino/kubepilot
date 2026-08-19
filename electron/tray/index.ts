
import path from 'node:path'

import { app, Menu, nativeImage, Tray, type BrowserWindow } from 'electron'

import { IPC_CHANNELS } from '../../shared/ipc-contract'
import type { ConnectionStatus } from '../../shared/types'
import type { ServiceContainer } from '../services'

const STATUS_GLYPH: Record<ConnectionStatus, string> = {
  connected: '🟢',
  connecting: '🟡',
  disconnected: '⚪️',
  error: '🔴',
}

function resolveTrayIconPath(): string {
  // `build/` ships inside the packaged app (see electron-builder.yml `files`)
  // and sits alongside the project root in dev, so this resolves in both.
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

    tray.setTitle(STATUS_GLYPH[status])

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
      { label: 'Refresh', click: () => void refresh() },
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
