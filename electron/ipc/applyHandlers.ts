import { ipcMain } from 'electron'

import { IPC_CHANNELS } from '../../shared/ipc-contract'
import type { ApplyParams } from '../../shared/types'
import type { ApplyService } from '../services/apply/ApplyService'
import { assertNonEmptyString, toIpcResult } from './ipcResult'

export function registerApplyHandlers(applyService: ApplyService): void {
  ipcMain.handle(IPC_CHANNELS.apply.run, (_event, params: Partial<ApplyParams>) =>
    toIpcResult(async () => {
      assertNonEmptyString(params?.yaml, 'yaml')
      return applyService.apply({ yaml: params.yaml, dryRun: params.dryRun })
    }),
  )
}
