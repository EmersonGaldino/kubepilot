import { ipcMain } from 'electron'

import { IPC_CHANNELS } from '../../shared/ipc-contract'
import type { DescribeParams } from '../../shared/types'
import type { DescribeService } from '../services/describe/DescribeService'
import { assertNonEmptyString, toIpcResult } from './ipcResult'

export function registerDescribeHandlers(describeService: DescribeService): void {
  ipcMain.handle(IPC_CHANNELS.describe.get, (_event, params: Partial<DescribeParams>) =>
    toIpcResult(async () => {
      assertNonEmptyString(params?.kind, 'kind')
      assertNonEmptyString(params?.namespace, 'namespace')
      assertNonEmptyString(params?.name, 'name')
      return describeService.describe({ kind: params.kind as DescribeParams['kind'], namespace: params.namespace, name: params.name })
    }),
  )
}
