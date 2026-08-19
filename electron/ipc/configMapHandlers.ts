import { ipcMain } from 'electron'

import { IPC_CHANNELS, type NamespacedGetParams, type NamespacedListParams } from '../../shared/ipc-contract'
import type { ConfigMapService } from '../services/configmaps/ConfigMapService'
import { assertNonEmptyString, toIpcResult } from './ipcResult'

export function registerConfigMapHandlers(configMapService: ConfigMapService): void {
  ipcMain.handle(IPC_CHANNELS.configmaps.list, (_event, params: Partial<NamespacedListParams>) =>
    toIpcResult(async () => {
      assertNonEmptyString(params?.namespace, 'namespace')
      return configMapService.list({ namespace: params.namespace })
    }),
  )

  ipcMain.handle(IPC_CHANNELS.configmaps.get, (_event, params: Partial<NamespacedGetParams>) =>
    toIpcResult(async () => {
      assertNonEmptyString(params?.namespace, 'namespace')
      assertNonEmptyString(params?.name, 'name')
      return configMapService.get({ namespace: params.namespace, name: params.name })
    }),
  )
}
