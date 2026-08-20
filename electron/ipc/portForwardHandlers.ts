import { ipcMain } from 'electron'

import { IPC_CHANNELS } from '../../shared/ipc-contract'
import type { PortForwardStartParams } from '../../shared/types'
import type { PortForwardService } from '../services/portforward/PortForwardService'
import { assertNonEmptyString, toIpcResult } from './ipcResult'

export function registerPortForwardHandlers(portForwardService: PortForwardService): void {
  ipcMain.handle(IPC_CHANNELS.portforward.start, (_event, params: Partial<PortForwardStartParams>) =>
    toIpcResult(async () => {
      assertNonEmptyString(params?.kind, 'kind')
      assertNonEmptyString(params?.namespace, 'namespace')
      assertNonEmptyString(params?.name, 'name')
      if (params.kind !== 'pod' && params.kind !== 'service') {
        throw new Error('"kind" must be pod or service')
      }
      if (typeof params.localPort !== 'number' || typeof params.targetPort !== 'number') {
        throw new Error('localPort and targetPort must be numbers')
      }
      return portForwardService.start({
        kind: params.kind,
        namespace: params.namespace,
        name: params.name,
        localPort: params.localPort,
        targetPort: params.targetPort,
      })
    }),
  )

  ipcMain.handle(IPC_CHANNELS.portforward.stop, (_event, id: string) =>
    toIpcResult(async () => {
      assertNonEmptyString(id, 'id')
      return portForwardService.stop(id)
    }),
  )

  ipcMain.handle(IPC_CHANNELS.portforward.list, () => toIpcResult(async () => portForwardService.list()))
}
