import { ipcMain } from 'electron'

import { IPC_CHANNELS, type NamespacedGetParams, type NamespacedListParams } from '../../shared/ipc-contract'
import type { JobService } from '../services/jobs/JobService'
import { assertNonEmptyString, toIpcResult } from './ipcResult'

export function registerJobHandlers(jobService: JobService): void {
  ipcMain.handle(IPC_CHANNELS.jobs.list, (_event, params: Partial<NamespacedListParams>) =>
    toIpcResult(async () => {
      assertNonEmptyString(params?.namespace, 'namespace')
      return jobService.list({ namespace: params.namespace })
    }),
  )

  ipcMain.handle(IPC_CHANNELS.jobs.get, (_event, params: Partial<NamespacedGetParams>) =>
    toIpcResult(async () => {
      assertNonEmptyString(params?.namespace, 'namespace')
      assertNonEmptyString(params?.name, 'name')
      return jobService.get({ namespace: params.namespace, name: params.name })
    }),
  )
}
