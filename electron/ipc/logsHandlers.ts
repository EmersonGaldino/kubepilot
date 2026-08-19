import { ipcMain, type BrowserWindow } from 'electron'

import { IPC_CHANNELS } from '../../shared/ipc-contract'
import type { LogsFetchParams } from '../../shared/types'
import type { LogsService } from '../services/logs/LogsService'
import { assertNonEmptyString, toIpcResult } from './ipcResult'

const MAX_TAIL_LINES = 5_000

function sanitizeParams(params: Partial<LogsFetchParams> | undefined): LogsFetchParams {
  assertNonEmptyString(params?.namespace, 'namespace')
  assertNonEmptyString(params?.podName, 'podName')

  const tailLines =
    typeof params.tailLines === 'number' ? Math.min(Math.max(Math.trunc(params.tailLines), 1), MAX_TAIL_LINES) : undefined

  return {
    namespace: params.namespace,
    podName: params.podName,
    containerName: params.containerName,
    tailLines,
    timestamps: params.timestamps,
    sinceSeconds: params.sinceSeconds,
  }
}

export function registerLogsHandlers(logsService: LogsService, getWindow: () => BrowserWindow | null): void {
  ipcMain.handle(IPC_CHANNELS.logs.fetch, (_event, params: Partial<LogsFetchParams>) =>
    toIpcResult(async () => logsService.fetch(sanitizeParams(params))),
  )

  ipcMain.handle(IPC_CHANNELS.logs.streamStart, (_event, params: Partial<LogsFetchParams>) =>
    toIpcResult(async () => {
      const streamId = await logsService.streamStart(sanitizeParams(params))
      return { streamId }
    }),
  )

  ipcMain.handle(IPC_CHANNELS.logs.streamStop, (_event, streamId: unknown) =>
    toIpcResult(async () => {
      assertNonEmptyString(streamId, 'streamId')
      logsService.streamStop(streamId)
    }),
  )

  logsService.onEvent((event) => {
    const window = getWindow()
    if (!window || window.isDestroyed()) return

    switch (event.type) {
      case 'data':
        window.webContents.send(IPC_CHANNELS.logs.streamData, { streamId: event.streamId, lines: event.lines })
        break
      case 'error':
        window.webContents.send(IPC_CHANNELS.logs.streamError, { streamId: event.streamId, error: event.error })
        break
      case 'end':
        window.webContents.send(IPC_CHANNELS.logs.streamEnd, { streamId: event.streamId })
        break
    }
  })
}
