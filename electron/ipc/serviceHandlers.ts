import { ipcMain } from 'electron'

import { IPC_CHANNELS, type NamespacedGetParams, type NamespacedListParams } from '../../shared/ipc-contract'
import type { ServiceService } from '../services/k8sservices/ServiceService'
import { assertNonEmptyString, toIpcResult } from './ipcResult'

export function registerServiceHandlers(serviceService: ServiceService): void {
  ipcMain.handle(IPC_CHANNELS.services.list, (_event, params: Partial<NamespacedListParams>) =>
    toIpcResult(async () => {
      assertNonEmptyString(params?.namespace, 'namespace')
      return serviceService.list({ namespace: params.namespace })
    }),
  )

  ipcMain.handle(IPC_CHANNELS.services.get, (_event, params: Partial<NamespacedGetParams>) =>
    toIpcResult(async () => {
      assertNonEmptyString(params?.namespace, 'namespace')
      assertNonEmptyString(params?.name, 'name')
      return serviceService.get({ namespace: params.namespace, name: params.name })
    }),
  )
}
