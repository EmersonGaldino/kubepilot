import { ipcMain } from 'electron'

import { IPC_CHANNELS } from '../../shared/ipc-contract'
import { isClusterScopedKind, type DescribeParams } from '../../shared/types'
import type { DescribeService } from '../services/describe/DescribeService'
import { assertNonEmptyString, toIpcResult } from './ipcResult'

export function registerDescribeHandlers(describeService: DescribeService): void {
  ipcMain.handle(IPC_CHANNELS.describe.get, (_event, params: Partial<DescribeParams>) =>
    toIpcResult(async () => {
      assertNonEmptyString(params?.kind, 'kind')
      assertNonEmptyString(params?.name, 'name')
      const kind = params.kind as DescribeParams['kind']
      const namespace = isClusterScopedKind(kind) ? (params.namespace ?? '') : params.namespace
      if (!isClusterScopedKind(kind)) assertNonEmptyString(namespace, 'namespace')
      return describeService.describe({ kind, namespace: namespace ?? '', name: params.name })
    }),
  )
}
