import { ipcMain, type BrowserWindow } from 'electron'

import { IPC_CHANNELS } from '../../shared/ipc-contract'
import type { ExecStartParams } from '../../shared/types'
import type { ExecService } from '../services/exec/ExecService'
import { assertNonEmptyString, toIpcResult } from './ipcResult'

function sanitizeParams(params: Partial<ExecStartParams> | undefined): ExecStartParams {
  assertNonEmptyString(params?.namespace, 'namespace')
  assertNonEmptyString(params?.podName, 'podName')

  return {
    namespace: params.namespace,
    podName: params.podName,
    containerName: params.containerName,
    command: Array.isArray(params.command) ? params.command : undefined,
  }
}

export function registerExecHandlers(execService: ExecService, getWindow: () => BrowserWindow | null): void {
  ipcMain.handle(IPC_CHANNELS.exec.start, (_event, params: Partial<ExecStartParams>) =>
    toIpcResult(async () => {
      const execId = await execService.start(sanitizeParams(params))
      return { execId }
    }),
  )

  ipcMain.handle(IPC_CHANNELS.exec.write, (_event, execId: unknown, data: unknown) =>
    toIpcResult(async () => {
      assertNonEmptyString(execId, 'execId')
      if (typeof data !== 'string') throw new Error('"data" must be a string')
      execService.write(execId, data)
    }),
  )

  ipcMain.handle(IPC_CHANNELS.exec.stop, (_event, execId: unknown) =>
    toIpcResult(async () => {
      assertNonEmptyString(execId, 'execId')
      execService.stop(execId)
    }),
  )

  execService.onEvent((event) => {
    const window = getWindow()
    if (!window || window.isDestroyed()) return

    switch (event.type) {
      case 'data':
        window.webContents.send(IPC_CHANNELS.exec.data, { execId: event.execId, chunk: event.chunk })
        break
      case 'error':
        window.webContents.send(IPC_CHANNELS.exec.error, { execId: event.execId, error: event.error })
        break
      case 'end':
        window.webContents.send(IPC_CHANNELS.exec.end, { execId: event.execId })
        break
    }
  })
}
