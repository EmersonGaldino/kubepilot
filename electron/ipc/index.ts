import type { BrowserWindow } from 'electron'

import { IPC_CHANNELS } from '../../shared/ipc-contract'
import type { ServiceContainer } from '../services'
import { registerActionHandlers } from './actionHandlers'
import { registerClusterHandlers } from './clusterHandlers'
import { registerConfigMapHandlers } from './configMapHandlers'
import { registerCronJobHandlers } from './cronJobHandlers'
import { registerDaemonSetHandlers } from './daemonSetHandlers'
import { registerDeploymentHandlers } from './deploymentHandlers'
import { registerDescribeHandlers } from './describeHandlers'
import { registerEventHandlers } from './eventHandlers'
import { registerExecHandlers } from './execHandlers'
import { registerJobHandlers } from './jobHandlers'
import { registerKubeconfigHandlers } from './kubeconfigHandlers'
import { registerLogsHandlers } from './logsHandlers'
import { registerNamespaceHandlers } from './namespaceHandlers'
import { registerPodHandlers } from './podHandlers'
import { registerReplicaSetHandlers } from './replicaSetHandlers'
import { registerSecretHandlers } from './secretHandlers'
import { registerServiceHandlers } from './serviceHandlers'
import { registerStatefulSetHandlers } from './statefulSetHandlers'

/** Wires every IPC channel to its service and forwards main-process events
 * (kubeconfig changes, log/exec stream data) to the renderer. */
export function registerIpcHandlers(services: ServiceContainer, getWindow: () => BrowserWindow | null): void {
  registerKubeconfigHandlers(services.clusterService)
  registerClusterHandlers(services.clusterService)
  registerNamespaceHandlers(services.namespaceService)
  registerPodHandlers(services.podService)
  registerDeploymentHandlers(services.deploymentService)
  registerStatefulSetHandlers(services.statefulSetService)
  registerDaemonSetHandlers(services.daemonSetService)
  registerReplicaSetHandlers(services.replicaSetService)
  registerJobHandlers(services.jobService)
  registerCronJobHandlers(services.cronJobService)
  registerServiceHandlers(services.serviceService)
  registerConfigMapHandlers(services.configMapService)
  registerSecretHandlers(services.secretService)
  registerEventHandlers(services.eventService)
  registerLogsHandlers(services.logsService, getWindow)
  registerDescribeHandlers(services.describeService)
  registerActionHandlers(services.actionService)
  registerExecHandlers(services.execService, getWindow)

  services.clusterService.on('changed', (snapshot) => {
    const window = getWindow()
    if (!window || window.isDestroyed()) return
    window.webContents.send(IPC_CHANNELS.kubeconfig.changed, snapshot)
  })
}
