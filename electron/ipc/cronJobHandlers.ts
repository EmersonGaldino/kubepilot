import { ipcMain } from 'electron'

import { IPC_CHANNELS, type NamespacedGetParams, type NamespacedListParams } from '../../shared/ipc-contract'
import type { CronJobService } from '../services/cronjobs/CronJobService'
import { assertNonEmptyString, toIpcResult } from './ipcResult'

export function registerCronJobHandlers(cronJobService: CronJobService): void {
  ipcMain.handle(IPC_CHANNELS.cronjobs.list, (_event, params: Partial<NamespacedListParams>) =>
    toIpcResult(async () => {
      assertNonEmptyString(params?.namespace, 'namespace')
      return cronJobService.list({ namespace: params.namespace })
    }),
  )

  ipcMain.handle(IPC_CHANNELS.cronjobs.get, (_event, params: Partial<NamespacedGetParams>) =>
    toIpcResult(async () => {
      assertNonEmptyString(params?.namespace, 'namespace')
      assertNonEmptyString(params?.name, 'name')
      return cronJobService.get({ namespace: params.namespace, name: params.name })
    }),
  )
}
