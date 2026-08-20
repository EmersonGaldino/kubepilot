import { contextBridge, ipcRenderer } from 'electron'

import { IPC_CHANNELS, type KubepilotApi } from '../shared/ipc-contract'

/**
 * The only bridge between the sandboxed renderer and the main process.
 * Everything exposed here is a narrow, typed function — never raw
 * `ipcRenderer`/`require` access — so the renderer can't reach Node.js or
 * arbitrary IPC channels even if compromised (XSS in rendered log output,
 * a malicious ConfigMap value, etc.).
 */
const kubepilotApi: KubepilotApi = {
  kubeconfig: {
    getContexts: () => ipcRenderer.invoke(IPC_CHANNELS.kubeconfig.getContexts),
    setContext: (contextName) => ipcRenderer.invoke(IPC_CHANNELS.kubeconfig.setContext, contextName),
    onChanged: (listener) => {
      const handler = (_event: Electron.IpcRendererEvent, payload: Parameters<typeof listener>[0]) => listener(payload)
      ipcRenderer.on(IPC_CHANNELS.kubeconfig.changed, handler)
      return () => ipcRenderer.removeListener(IPC_CHANNELS.kubeconfig.changed, handler)
    },
  },

  cluster: {
    getInfo: () => ipcRenderer.invoke(IPC_CHANNELS.cluster.getInfo),
    refresh: () => ipcRenderer.invoke(IPC_CHANNELS.cluster.refresh),
  },

  namespaces: {
    list: () => ipcRenderer.invoke(IPC_CHANNELS.namespaces.list),
    get: (params) => ipcRenderer.invoke(IPC_CHANNELS.namespaces.get, params),
    create: (params) => ipcRenderer.invoke(IPC_CHANNELS.namespaces.create, params),
    delete: (params) => ipcRenderer.invoke(IPC_CHANNELS.namespaces.delete, params),
  },

  pods: {
    list: (params) => ipcRenderer.invoke(IPC_CHANNELS.pods.list, params),
    get: (params) => ipcRenderer.invoke(IPC_CHANNELS.pods.get, params),
  },

  deployments: {
    list: (params) => ipcRenderer.invoke(IPC_CHANNELS.deployments.list, params),
    get: (params) => ipcRenderer.invoke(IPC_CHANNELS.deployments.get, params),
  },

  statefulsets: {
    list: (params) => ipcRenderer.invoke(IPC_CHANNELS.statefulsets.list, params),
    get: (params) => ipcRenderer.invoke(IPC_CHANNELS.statefulsets.get, params),
  },

  daemonsets: {
    list: (params) => ipcRenderer.invoke(IPC_CHANNELS.daemonsets.list, params),
    get: (params) => ipcRenderer.invoke(IPC_CHANNELS.daemonsets.get, params),
  },

  replicasets: {
    list: (params) => ipcRenderer.invoke(IPC_CHANNELS.replicasets.list, params),
    get: (params) => ipcRenderer.invoke(IPC_CHANNELS.replicasets.get, params),
  },

  jobs: {
    list: (params) => ipcRenderer.invoke(IPC_CHANNELS.jobs.list, params),
    get: (params) => ipcRenderer.invoke(IPC_CHANNELS.jobs.get, params),
  },

  cronjobs: {
    list: (params) => ipcRenderer.invoke(IPC_CHANNELS.cronjobs.list, params),
    get: (params) => ipcRenderer.invoke(IPC_CHANNELS.cronjobs.get, params),
  },

  services: {
    list: (params) => ipcRenderer.invoke(IPC_CHANNELS.services.list, params),
    get: (params) => ipcRenderer.invoke(IPC_CHANNELS.services.get, params),
  },

  configmaps: {
    list: (params) => ipcRenderer.invoke(IPC_CHANNELS.configmaps.list, params),
    get: (params) => ipcRenderer.invoke(IPC_CHANNELS.configmaps.get, params),
  },

  secrets: {
    list: (params) => ipcRenderer.invoke(IPC_CHANNELS.secrets.list, params),
    get: (params) => ipcRenderer.invoke(IPC_CHANNELS.secrets.get, params),
  },

  events: {
    list: (params) => ipcRenderer.invoke(IPC_CHANNELS.events.list, params),
  },

  nodes: {
    list: () => ipcRenderer.invoke(IPC_CHANNELS.nodes.list),
    get: (params) => ipcRenderer.invoke(IPC_CHANNELS.nodes.get, params),
    cordon: (params) => ipcRenderer.invoke(IPC_CHANNELS.nodes.cordon, params),
  },

  ingresses: {
    list: (params) => ipcRenderer.invoke(IPC_CHANNELS.ingresses.list, params),
    get: (params) => ipcRenderer.invoke(IPC_CHANNELS.ingresses.get, params),
  },

  hpa: {
    list: (params) => ipcRenderer.invoke(IPC_CHANNELS.hpa.list, params),
    get: (params) => ipcRenderer.invoke(IPC_CHANNELS.hpa.get, params),
  },

  pvcs: {
    list: (params) => ipcRenderer.invoke(IPC_CHANNELS.pvcs.list, params),
    get: (params) => ipcRenderer.invoke(IPC_CHANNELS.pvcs.get, params),
  },

  pvs: {
    list: () => ipcRenderer.invoke(IPC_CHANNELS.pvs.list),
    get: (params) => ipcRenderer.invoke(IPC_CHANNELS.pvs.get, params),
  },

  storageclasses: {
    list: () => ipcRenderer.invoke(IPC_CHANNELS.storageclasses.list),
    get: (params) => ipcRenderer.invoke(IPC_CHANNELS.storageclasses.get, params),
  },

  describe: {
    get: (params) => ipcRenderer.invoke(IPC_CHANNELS.describe.get, params),
  },

  actions: {
    delete: (params) => ipcRenderer.invoke(IPC_CHANNELS.actions.delete, params),
    scale: (params) => ipcRenderer.invoke(IPC_CHANNELS.actions.scale, params),
    restart: (params) => ipcRenderer.invoke(IPC_CHANNELS.actions.restart, params),
  },

  apply: {
    run: (params) => ipcRenderer.invoke(IPC_CHANNELS.apply.run, params),
  },

  portforward: {
    start: (params) => ipcRenderer.invoke(IPC_CHANNELS.portforward.start, params),
    stop: (id) => ipcRenderer.invoke(IPC_CHANNELS.portforward.stop, id),
    list: () => ipcRenderer.invoke(IPC_CHANNELS.portforward.list),
  },

  exec: {
    start: (params) => ipcRenderer.invoke(IPC_CHANNELS.exec.start, params),
    write: (execId, data) => ipcRenderer.invoke(IPC_CHANNELS.exec.write, execId, data),
    stop: (execId) => ipcRenderer.invoke(IPC_CHANNELS.exec.stop, execId),
    subscribe: (execId, handlers) => {
      const onData = (_event: Electron.IpcRendererEvent, payload: { execId: string; chunk: string }) => {
        if (payload.execId === execId) handlers.onData(payload.chunk)
      }
      const onError = (_event: Electron.IpcRendererEvent, payload: { execId: string; error: string }) => {
        if (payload.execId === execId) handlers.onError(payload.error)
      }
      const onEnd = (_event: Electron.IpcRendererEvent, payload: { execId: string }) => {
        if (payload.execId === execId) handlers.onEnd()
      }

      ipcRenderer.on(IPC_CHANNELS.exec.data, onData)
      ipcRenderer.on(IPC_CHANNELS.exec.error, onError)
      ipcRenderer.on(IPC_CHANNELS.exec.end, onEnd)

      return () => {
        ipcRenderer.removeListener(IPC_CHANNELS.exec.data, onData)
        ipcRenderer.removeListener(IPC_CHANNELS.exec.error, onError)
        ipcRenderer.removeListener(IPC_CHANNELS.exec.end, onEnd)
      }
    },
  },

  logs: {
    fetch: (params) => ipcRenderer.invoke(IPC_CHANNELS.logs.fetch, params),
    streamStart: (params) => ipcRenderer.invoke(IPC_CHANNELS.logs.streamStart, params),
    streamStop: (streamId) => ipcRenderer.invoke(IPC_CHANNELS.logs.streamStop, streamId),
    subscribe: (streamId, handlers) => {
      const onData = (_event: Electron.IpcRendererEvent, payload: { streamId: string; lines: string[] }) => {
        if (payload.streamId === streamId) handlers.onData(payload.lines)
      }
      const onError = (_event: Electron.IpcRendererEvent, payload: { streamId: string; error: string }) => {
        if (payload.streamId === streamId) handlers.onError(payload.error)
      }
      const onEnd = (_event: Electron.IpcRendererEvent, payload: { streamId: string }) => {
        if (payload.streamId === streamId) handlers.onEnd()
      }

      ipcRenderer.on(IPC_CHANNELS.logs.streamData, onData)
      ipcRenderer.on(IPC_CHANNELS.logs.streamError, onError)
      ipcRenderer.on(IPC_CHANNELS.logs.streamEnd, onEnd)

      return () => {
        ipcRenderer.removeListener(IPC_CHANNELS.logs.streamData, onData)
        ipcRenderer.removeListener(IPC_CHANNELS.logs.streamError, onError)
        ipcRenderer.removeListener(IPC_CHANNELS.logs.streamEnd, onEnd)
      }
    },
  },

  tray: {
    onNavigate: (listener) => {
      const handler = (_event: Electron.IpcRendererEvent, route: string) => listener(route)
      ipcRenderer.on(IPC_CHANNELS.tray.navigate, handler)
      return () => ipcRenderer.removeListener(IPC_CHANNELS.tray.navigate, handler)
    },
  },

  window: {
    notifySplashDone: () => ipcRenderer.send(IPC_CHANNELS.window.splashDone),
  },

  update: {
    check: () => ipcRenderer.invoke(IPC_CHANNELS.update.check),
    download: () => ipcRenderer.invoke(IPC_CHANNELS.update.download),
    install: () => ipcRenderer.invoke(IPC_CHANNELS.update.install),
    onAvailable: (listener) => {
      const handler = (_event: Electron.IpcRendererEvent, version: string) => listener(version)
      ipcRenderer.on(IPC_CHANNELS.update.available, handler)
      return () => ipcRenderer.removeListener(IPC_CHANNELS.update.available, handler)
    },
    onNotAvailable: (listener) => {
      const handler = () => listener()
      ipcRenderer.on(IPC_CHANNELS.update.notAvailable, handler)
      return () => ipcRenderer.removeListener(IPC_CHANNELS.update.notAvailable, handler)
    },
    onProgress: (listener) => {
      const handler = (_event: Electron.IpcRendererEvent, progress: Parameters<typeof listener>[0]) => listener(progress)
      ipcRenderer.on(IPC_CHANNELS.update.progress, handler)
      return () => ipcRenderer.removeListener(IPC_CHANNELS.update.progress, handler)
    },
    onDownloaded: (listener) => {
      const handler = (_event: Electron.IpcRendererEvent, version: string) => listener(version)
      ipcRenderer.on(IPC_CHANNELS.update.downloaded, handler)
      return () => ipcRenderer.removeListener(IPC_CHANNELS.update.downloaded, handler)
    },
    onError: (listener) => {
      const handler = (_event: Electron.IpcRendererEvent, error: string) => listener(error)
      ipcRenderer.on(IPC_CHANNELS.update.error, handler)
      return () => ipcRenderer.removeListener(IPC_CHANNELS.update.error, handler)
    },
  },
}

contextBridge.exposeInMainWorld('kubepilot', kubepilotApi)
