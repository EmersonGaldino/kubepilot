import { ipcMain } from 'electron'

import { IPC_CHANNELS } from '../../shared/ipc-contract'
import type { CordonParams } from '../../shared/types'
import type { NodeService } from '../services/nodes/NodeService'
import { assertNonEmptyString, toIpcResult } from './ipcResult'

export function registerNodeHandlers(nodeService: NodeService): void {
  ipcMain.handle(IPC_CHANNELS.nodes.list, () => toIpcResult(async () => nodeService.list()))

  ipcMain.handle(IPC_CHANNELS.nodes.get, (_event, params: { name?: string }) =>
    toIpcResult(async () => {
      assertNonEmptyString(params?.name, 'name')
      return nodeService.get(params.name)
    }),
  )

  ipcMain.handle(IPC_CHANNELS.nodes.cordon, (_event, params: Partial<CordonParams>) =>
    toIpcResult(async () => {
      assertNonEmptyString(params?.name, 'name')
      if (typeof params.unschedulable !== 'boolean') {
        throw new Error('"unschedulable" must be a boolean')
      }
      return nodeService.cordon(params.name, params.unschedulable)
    }),
  )
}
