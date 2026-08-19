import { ipcMain } from 'electron'

import { IPC_CHANNELS } from '../../shared/ipc-contract'
import type { DeleteParams, RestartParams, ScaleParams } from '../../shared/types'
import type { ResourceActionService } from '../services/actions/ResourceActionService'
import { assertNonEmptyString, toIpcResult } from './ipcResult'

export function registerActionHandlers(actionService: ResourceActionService): void {
  ipcMain.handle(IPC_CHANNELS.actions.delete, (_event, params: Partial<DeleteParams>) =>
    toIpcResult(async () => {
      assertNonEmptyString(params?.kind, 'kind')
      assertNonEmptyString(params?.namespace, 'namespace')
      assertNonEmptyString(params?.name, 'name')
      return actionService.delete({ kind: params.kind as DeleteParams['kind'], namespace: params.namespace, name: params.name })
    }),
  )

  ipcMain.handle(IPC_CHANNELS.actions.scale, (_event, params: Partial<ScaleParams>) =>
    toIpcResult(async () => {
      assertNonEmptyString(params?.kind, 'kind')
      assertNonEmptyString(params?.namespace, 'namespace')
      assertNonEmptyString(params?.name, 'name')
      if (typeof params.replicas !== 'number' || params.replicas < 0 || !Number.isInteger(params.replicas)) {
        throw new Error('"replicas" must be a non-negative integer')
      }
      return actionService.scale({
        kind: params.kind as ScaleParams['kind'],
        namespace: params.namespace,
        name: params.name,
        replicas: params.replicas,
      })
    }),
  )

  ipcMain.handle(IPC_CHANNELS.actions.restart, (_event, params: Partial<RestartParams>) =>
    toIpcResult(async () => {
      assertNonEmptyString(params?.kind, 'kind')
      assertNonEmptyString(params?.namespace, 'namespace')
      assertNonEmptyString(params?.name, 'name')
      return actionService.restart({ kind: params.kind as RestartParams['kind'], namespace: params.namespace, name: params.name })
    }),
  )
}
