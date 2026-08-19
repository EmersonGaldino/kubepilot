import path from 'node:path'

import { app, BrowserWindow, shell } from 'electron'

export function createMainWindow(): BrowserWindow {
  const window = new BrowserWindow({
    width: 1320,
    height: 840,
    minWidth: 980,
    minHeight: 640,
    show: false,
    backgroundColor: '#0d1117',
    titleBarStyle: 'hidden',
    // `hiddenInset`'s default traffic-light position sat right on top of the
    // sidebar logo. `hidden` + an explicit position lets us reserve a
    // dedicated draggable strip above the layout instead (see AppLayout).
    trafficLightPosition: { x: 16, y: 13 },
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  })

  window.once('ready-to-show', () => window.show())

  if (!app.isPackaged) {
    // Surfaces renderer console output (including uncaught errors) in the
    // same terminal as the main process — there's no other way to see them
    // without manually opening DevTools every run.
    window.webContents.on('console-message', (event) => {
      console.log(`[renderer:${event.level}] ${event.message} (${event.sourceId}:${event.lineNumber})`)
    })
  }

  // Renderer-initiated new windows (target="_blank", window.open) always go
  // to the OS browser — the app never embeds arbitrary external sites.
  window.webContents.setWindowOpenHandler(({ url }) => {
    void shell.openExternal(url)
    return { action: 'deny' }
  })

  // `VITE_DEV_SERVER_URL` is injected by vite-plugin-electron while `npm run dev` is active.
  if (process.env.VITE_DEV_SERVER_URL) {
    void window.loadURL(process.env.VITE_DEV_SERVER_URL)
  } else {
    void window.loadFile(path.join(__dirname, '../dist/index.html'))
  }

  return window
}

/** Hides instead of destroying, so the tray icon can reopen the same window
 * (and its React state) instantly instead of re-rendering from scratch. */
export function hideInsteadOfClose(window: BrowserWindow, isQuitting: () => boolean): void {
  window.on('close', (event) => {
    if (isQuitting()) return
    event.preventDefault()
    window.hide()
  })
}
