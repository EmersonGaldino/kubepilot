import { ipcMain } from 'electron'

import { IPC_CHANNELS, type NamespacedGetParams, type NamespacedListParams } from '../../shared/ipc-contract'
import type { DaemonSetService } from '../services/daemonsets/DaemonSetService'
import { assertNonEmptyString, toIpcResult } from './ipcResult'

export function registerDaemonSetHandlers(daemonSetService: DaemonSetService): void {
  ipcMain.handle(IPC_CHANNELS.daemonsets.list, (_event, params: Partial<NamespacedListParams>) =>
    toIpcResult(async () => {
      assertNonEmptyString(params?.namespace, 'namespace')
      return daemonSetService.list({ namespace: params.namespace })
    }),
  )

  ipcMain.handle(IPC_CHANNELS.daemonsets.get, (_event, params: Partial<NamespacedGetParams>) =>
    toIpcResult(async () => {
      assertNonEmptyString(params?.namespace, 'namespace')
      assertNonEmptyString(params?.name, 'name')
      return daemonSetService.get({ namespace: params.namespace, name: params.name })
    }),
  )
}
