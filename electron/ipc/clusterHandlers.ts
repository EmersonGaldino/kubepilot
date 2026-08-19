import { ipcMain } from 'electron'

import { IPC_CHANNELS } from '../../shared/ipc-contract'
import type { ClusterService } from '../services/clusters/ClusterService'
import { toIpcResult } from './ipcResult'

export function registerClusterHandlers(clusterService: ClusterService): void {
  ipcMain.handle(IPC_CHANNELS.cluster.getInfo, () => toIpcResult(async () => clusterService.getClusterInfo()))
  ipcMain.handle(IPC_CHANNELS.cluster.refresh, () => toIpcResult(async () => clusterService.refreshActiveContext()))
}
