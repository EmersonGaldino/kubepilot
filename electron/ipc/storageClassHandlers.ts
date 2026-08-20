import { ipcMain } from 'electron'

import { IPC_CHANNELS } from '../../shared/ipc-contract'
import type { StorageClassService } from '../services/storageclasses/StorageClassService'
import { assertNonEmptyString, toIpcResult } from './ipcResult'

export function registerStorageClassHandlers(storageClassService: StorageClassService): void {
  ipcMain.handle(IPC_CHANNELS.storageclasses.list, () => toIpcResult(async () => storageClassService.list()))

  ipcMain.handle(IPC_CHANNELS.storageclasses.get, (_event, params: { name?: string }) =>
    toIpcResult(async () => {
      assertNonEmptyString(params?.name, 'name')
      return storageClassService.get(params.name)
    }),
  )
}
