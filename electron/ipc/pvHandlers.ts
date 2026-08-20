import { ipcMain } from 'electron'

import { IPC_CHANNELS } from '../../shared/ipc-contract'
import type { PvService } from '../services/pvs/PvService'
import { assertNonEmptyString, toIpcResult } from './ipcResult'

export function registerPvHandlers(pvService: PvService): void {
  ipcMain.handle(IPC_CHANNELS.pvs.list, () => toIpcResult(async () => pvService.list()))

  ipcMain.handle(IPC_CHANNELS.pvs.get, (_event, params: { name?: string }) =>
    toIpcResult(async () => {
      assertNonEmptyString(params?.name, 'name')
      return pvService.get(params.name)
    }),
  )
}
