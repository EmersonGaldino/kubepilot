import { ipcMain } from 'electron'

import { IPC_CHANNELS, type NamespacedGetParams, type NamespacedListParams } from '../../shared/ipc-contract'
import type { StatefulSetService } from '../services/statefulsets/StatefulSetService'
import { assertNonEmptyString, toIpcResult } from './ipcResult'

export function registerStatefulSetHandlers(statefulSetService: StatefulSetService): void {
  ipcMain.handle(IPC_CHANNELS.statefulsets.list, (_event, params: Partial<NamespacedListParams>) =>
    toIpcResult(async () => {
      assertNonEmptyString(params?.namespace, 'namespace')
      return statefulSetService.list({ namespace: params.namespace })
    }),
  )

  ipcMain.handle(IPC_CHANNELS.statefulsets.get, (_event, params: Partial<NamespacedGetParams>) =>
    toIpcResult(async () => {
      assertNonEmptyString(params?.namespace, 'namespace')
      assertNonEmptyString(params?.name, 'name')
      return statefulSetService.get({ namespace: params.namespace, name: params.name })
    }),
  )
}
