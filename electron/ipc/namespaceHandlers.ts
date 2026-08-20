import { ipcMain } from 'electron'

import { IPC_CHANNELS } from '../../shared/ipc-contract'
import type { NamespaceCreateParams } from '../../shared/types'
import type { NamespaceService } from '../services/namespaces/NamespaceService'
import { assertNonEmptyString, toIpcResult } from './ipcResult'

export function registerNamespaceHandlers(namespaceService: NamespaceService): void {
  ipcMain.handle(IPC_CHANNELS.namespaces.list, () => toIpcResult(async () => namespaceService.list()))

  ipcMain.handle(IPC_CHANNELS.namespaces.get, (_event, params: { name?: string }) =>
    toIpcResult(async () => {
      assertNonEmptyString(params?.name, 'name')
      return namespaceService.get(params.name)
    }),
  )

  ipcMain.handle(IPC_CHANNELS.namespaces.create, (_event, params: Partial<NamespaceCreateParams>) =>
    toIpcResult(async () => {
      assertNonEmptyString(params?.name, 'name')
      return namespaceService.create({ name: params.name, labels: params.labels })
    }),
  )

  ipcMain.handle(IPC_CHANNELS.namespaces.delete, (_event, params: { name?: string }) =>
    toIpcResult(async () => {
      assertNonEmptyString(params?.name, 'name')
      return namespaceService.delete(params.name)
    }),
  )
}
