import { ipcMain } from 'electron'

import { IPC_CHANNELS } from '../../shared/ipc-contract'
import type { ClusterService } from '../services/clusters/ClusterService'
import { assertNonEmptyString, toIpcResult } from './ipcResult'

export function registerKubeconfigHandlers(clusterService: ClusterService): void {
  ipcMain.handle(IPC_CHANNELS.kubeconfig.getContexts, () =>
    toIpcResult(async () => clusterService.getContextsSnapshot()),
  )

  ipcMain.handle(IPC_CHANNELS.kubeconfig.setContext, (_event, contextName: unknown) =>
    toIpcResult(async () => {
      assertNonEmptyString(contextName, 'contextName')
      return clusterService.setActiveContext(contextName)
    }),
  )
}
