import { ipcMain } from 'electron'

import { IPC_CHANNELS, type DeploymentGetParams, type DeploymentsListParams } from '../../shared/ipc-contract'
import type { DeploymentService } from '../services/deployments/DeploymentService'
import { assertNonEmptyString, toIpcResult } from './ipcResult'

export function registerDeploymentHandlers(deploymentService: DeploymentService): void {
  ipcMain.handle(IPC_CHANNELS.deployments.list, (_event, params: Partial<DeploymentsListParams>) =>
    toIpcResult(async () => {
      assertNonEmptyString(params?.namespace, 'namespace')
      return deploymentService.list({ namespace: params.namespace })
    }),
  )

  ipcMain.handle(IPC_CHANNELS.deployments.get, (_event, params: Partial<DeploymentGetParams>) =>
    toIpcResult(async () => {
      assertNonEmptyString(params?.namespace, 'namespace')
      assertNonEmptyString(params?.name, 'name')
      return deploymentService.get({ namespace: params.namespace, name: params.name })
    }),
  )
}
