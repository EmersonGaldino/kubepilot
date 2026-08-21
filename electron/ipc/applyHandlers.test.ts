import { beforeEach, describe, expect, it, vi } from 'vitest'

const { handle } = vi.hoisted(() => ({ handle: vi.fn() }))

vi.mock('electron', () => ({ ipcMain: { handle } }))

import { IPC_CHANNELS } from '../../shared/ipc-contract'
import type { ApplyService } from '../services/apply/ApplyService'
import { registerApplyHandlers } from './applyHandlers'

describe('registerApplyHandlers', () => {
  beforeEach(() => handle.mockReset())

  it('keeps server-side apply force opt-in and validates its type', async () => {
    const apply = vi.fn().mockResolvedValue({ kind: 'ConfigMap' })
    registerApplyHandlers({ apply } as unknown as ApplyService)

    const handler = handle.mock.calls.find(([channel]) => channel === IPC_CHANNELS.apply.run)?.[1] as (
      event: unknown,
      params: unknown,
    ) => Promise<unknown>

    await expect(handler({}, { yaml: 'apiVersion: v1', force: false })).resolves.toEqual({
      ok: true,
      data: { kind: 'ConfigMap' },
    })
    expect(apply).toHaveBeenCalledWith({ yaml: 'apiVersion: v1', dryRun: undefined, force: false })

    await expect(handler({}, { yaml: 'apiVersion: v1', force: 'true' })).resolves.toEqual({
      ok: false,
      error: '"force" must be a boolean',
    })
  })
})
