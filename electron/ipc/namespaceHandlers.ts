import { ipcMain } from 'electron'

import { IPC_CHANNELS } from '../../shared/ipc-contract'
import type { NamespaceService } from '../services/namespaces/NamespaceService'
import { toIpcResult } from './ipcResult'

export function registerNamespaceHandlers(namespaceService: NamespaceService): void {
  ipcMain.handle(IPC_CHANNELS.namespaces.list, () => toIpcResult(async () => namespaceService.list()))
}
