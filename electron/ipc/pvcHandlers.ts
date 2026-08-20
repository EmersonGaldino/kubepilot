import { ipcMain } from 'electron'

import { IPC_CHANNELS, type NamespacedGetParams, type NamespacedListParams } from '../../shared/ipc-contract'
import type { PvcService } from '../services/pvcs/PvcService'
import { assertNonEmptyString, toIpcResult } from './ipcResult'

export function registerPvcHandlers(pvcService: PvcService): void {
  ipcMain.handle(IPC_CHANNELS.pvcs.list, (_event, params: Partial<NamespacedListParams>) =>
    toIpcResult(async () => {
      assertNonEmptyString(params?.namespace, 'namespace')
      return pvcService.list(params.namespace)
    }),
  )

  ipcMain.handle(IPC_CHANNELS.pvcs.get, (_event, params: Partial<NamespacedGetParams>) =>
    toIpcResult(async () => {
      assertNonEmptyString(params?.namespace, 'namespace')
      assertNonEmptyString(params?.name, 'name')
      return pvcService.get(params.namespace, params.name)
    }),
  )
}
