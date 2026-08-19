import { ipcMain } from 'electron'

import { IPC_CHANNELS, type NamespacedGetParams, type NamespacedListParams } from '../../shared/ipc-contract'
import type { ReplicaSetService } from '../services/replicasets/ReplicaSetService'
import { assertNonEmptyString, toIpcResult } from './ipcResult'

export function registerReplicaSetHandlers(replicaSetService: ReplicaSetService): void {
  ipcMain.handle(IPC_CHANNELS.replicasets.list, (_event, params: Partial<NamespacedListParams>) =>
    toIpcResult(async () => {
      assertNonEmptyString(params?.namespace, 'namespace')
      return replicaSetService.list({ namespace: params.namespace })
    }),
  )

  ipcMain.handle(IPC_CHANNELS.replicasets.get, (_event, params: Partial<NamespacedGetParams>) =>
    toIpcResult(async () => {
      assertNonEmptyString(params?.namespace, 'namespace')
      assertNonEmptyString(params?.name, 'name')
      return replicaSetService.get({ namespace: params.namespace, name: params.name })
    }),
  )
}
