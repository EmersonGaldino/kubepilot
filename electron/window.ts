import path from 'node:path'

import { app, BrowserWindow, shell } from 'electron'

import { isSafeExternalUrl } from './window-security'

function preloadScript(): string {
  return path.join(app.getAppPath(), 'dist-electron', 'preload.js')
}

function rendererIndexHtml(): string {
  return path.join(app.getAppPath(), 'dist', 'index.html')
}

export function createMainWindow(): BrowserWindow {
  const window = new BrowserWindow({
    width: 1320,
    height: 840,
    minWidth: 980,
    minHeight: 640,
    show: true,
    backgroundColor: '#0d1117',
    titleBarStyle: 'hidden',
    // `hiddenInset`'s default traffic-light position sat right on top of the
    // sidebar logo. `hidden` + an explicit position lets us reserve a
    // dedicated draggable strip above the layout instead (see AppLayout).
    trafficLightPosition: { x: 16, y: 13 },
    webPreferences: {
      preload: preloadScript(),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  })

  // The splash screen (rendered by AppLayout, covering the whole window)
  // is web content, so it can't cover macOS's natively-drawn traffic
  // lights — they'd otherwise float on top of it looking like they belong
  // to a window that isn't ready yet. Hide them until the renderer reports
  // the splash has faded out (see `notifySplashDone`/`revealWindowControls`).
  if (process.platform === 'darwin') {
    window.setWindowButtonVisibility(false)
  }

  const reveal = () => {
    if (!window.isDestroyed() && !window.isVisible()) window.show()
  }

  window.once('ready-to-show', reveal)
  window.webContents.once('did-finish-load', reveal)
  window.webContents.once('did-fail-load', (_event, code, description, url) => {
    console.error(`[window] failed to load ${url} (${code}): ${description}`)
    reveal()
  })
  setTimeout(reveal, 2500)

  if (!app.isPackaged) {
    // Surfaces renderer console output (including uncaught errors) in the
    // same terminal as the main process — there's no other way to see them
    // without manually opening DevTools every run.
    window.webContents.on('console-message', (event) => {
      console.log(`[renderer:${event.level}] ${event.message} (${event.sourceId}:${event.lineNumber})`)
    })
  }

  // Renderer-initiated new windows (target="_blank", window.open) always go
  // to the OS browser — the app never embeds arbitrary external sites. Only
  // http(s) is allowed, never a local file or custom URI scheme.
  window.webContents.setWindowOpenHandler(({ url }) => {
    if (isSafeExternalUrl(url)) void shell.openExternal(url)
    return { action: 'deny' }
  })

  // The renderer is a local, bundled document. Never let an in-app navigation
  // replace it with remote content, even if future UI content gains a link.
  window.webContents.on('will-navigate', (event) => event.preventDefault())

  // `VITE_DEV_SERVER_URL` is injected by vite-plugin-electron while `npm run dev` is active.
  if (process.env.VITE_DEV_SERVER_URL) {
    void window.loadURL(process.env.VITE_DEV_SERVER_URL)
  } else {
    void window.loadFile(rendererIndexHtml())
  }

  return window
}

/** Reveals the traffic lights hidden at window creation, once the splash
 * screen covering them has faded out. No-op on platforms without them. */
export function revealWindowControls(window: BrowserWindow): void {
  if (process.platform === 'darwin' && !window.isDestroyed()) {
    window.setWindowButtonVisibility(true)
  }
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
