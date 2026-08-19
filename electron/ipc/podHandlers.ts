import { ipcMain } from 'electron'

import { IPC_CHANNELS, type PodGetParams, type PodsListParams } from '../../shared/ipc-contract'
import type { PodService } from '../services/pods/PodService'
import { assertNonEmptyString, toIpcResult } from './ipcResult'

export function registerPodHandlers(podService: PodService): void {
  ipcMain.handle(IPC_CHANNELS.pods.list, (_event, params: Partial<PodsListParams>) =>
    toIpcResult(async () => {
      assertNonEmptyString(params?.namespace, 'namespace')
      return podService.list({ namespace: params.namespace, labelSelector: params.labelSelector })
    }),
  )

  ipcMain.handle(IPC_CHANNELS.pods.get, (_event, params: Partial<PodGetParams>) =>
    toIpcResult(async () => {
      assertNonEmptyString(params?.namespace, 'namespace')
      assertNonEmptyString(params?.name, 'name')
      return podService.get({ namespace: params.namespace, name: params.name })
    }),
  )
}
