import { ipcMain } from 'electron'

import { IPC_CHANNELS, type NamespacedGetParams, type NamespacedListParams } from '../../shared/ipc-contract'
import type { IngressService } from '../services/ingresses/IngressService'
import { assertNonEmptyString, toIpcResult } from './ipcResult'

export function registerIngressHandlers(ingressService: IngressService): void {
  ipcMain.handle(IPC_CHANNELS.ingresses.list, (_event, params: Partial<NamespacedListParams>) =>
    toIpcResult(async () => {
      assertNonEmptyString(params?.namespace, 'namespace')
      return ingressService.list(params.namespace)
    }),
  )

  ipcMain.handle(IPC_CHANNELS.ingresses.get, (_event, params: Partial<NamespacedGetParams>) =>
    toIpcResult(async () => {
      assertNonEmptyString(params?.namespace, 'namespace')
      assertNonEmptyString(params?.name, 'name')
      return ingressService.get(params.namespace, params.name)
    }),
  )
}
