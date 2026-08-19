import { ipcMain } from 'electron'

import { IPC_CHANNELS, type NamespacedGetParams, type NamespacedListParams } from '../../shared/ipc-contract'
import type { SecretService } from '../services/secrets/SecretService'
import { assertNonEmptyString, toIpcResult } from './ipcResult'

export function registerSecretHandlers(secretService: SecretService): void {
  ipcMain.handle(IPC_CHANNELS.secrets.list, (_event, params: Partial<NamespacedListParams>) =>
    toIpcResult(async () => {
      assertNonEmptyString(params?.namespace, 'namespace')
      return secretService.list({ namespace: params.namespace })
    }),
  )

  ipcMain.handle(IPC_CHANNELS.secrets.get, (_event, params: Partial<NamespacedGetParams>) =>
    toIpcResult(async () => {
      assertNonEmptyString(params?.namespace, 'namespace')
      assertNonEmptyString(params?.name, 'name')
      return secretService.get({ namespace: params.namespace, name: params.name })
    }),
  )
}
