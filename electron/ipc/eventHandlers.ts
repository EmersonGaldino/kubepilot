import { ipcMain } from 'electron'

import { IPC_CHANNELS, type NamespacedListParams } from '../../shared/ipc-contract'
import type { EventService } from '../services/events/EventService'
import { assertNonEmptyString, toIpcResult } from './ipcResult'

export function registerEventHandlers(eventService: EventService): void {
  ipcMain.handle(IPC_CHANNELS.events.list, (_event, params: Partial<NamespacedListParams>) =>
    toIpcResult(async () => {
      assertNonEmptyString(params?.namespace, 'namespace')
      return eventService.list({ namespace: params.namespace })
    }),
  )
}
