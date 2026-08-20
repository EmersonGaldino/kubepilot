import { ipcMain } from 'electron'

import { IPC_CHANNELS, type NamespacedGetParams, type NamespacedListParams } from '../../shared/ipc-contract'
import type { HpaService } from '../services/hpa/HpaService'
import { assertNonEmptyString, toIpcResult } from './ipcResult'

export function registerHpaHandlers(hpaService: HpaService): void {
  ipcMain.handle(IPC_CHANNELS.hpa.list, (_event, params: Partial<NamespacedListParams>) =>
    toIpcResult(async () => {
      assertNonEmptyString(params?.namespace, 'namespace')
      return hpaService.list(params.namespace)
    }),
  )

  ipcMain.handle(IPC_CHANNELS.hpa.get, (_event, params: Partial<NamespacedGetParams>) =>
    toIpcResult(async () => {
      assertNonEmptyString(params?.namespace, 'namespace')
      assertNonEmptyString(params?.name, 'name')
      return hpaService.get(params.namespace, params.name)
    }),
  )
}
