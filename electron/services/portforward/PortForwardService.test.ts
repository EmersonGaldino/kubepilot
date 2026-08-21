import type { Server, Socket } from 'node:net'

import { describe, expect, it, vi } from 'vitest'

import type { ClusterService } from '../clusters/ClusterService'
import { PortForwardService } from './PortForwardService'

describe('PortForwardService', () => {
  it('destroys active local clients before closing a forward', async () => {
    const close = vi.fn((callback: () => void) => callback())
    const destroy = vi.fn()
    const server = { close } as unknown as Server
    const sockets = new Set<Socket>([{ destroy } as unknown as Socket])

    const service = new PortForwardService({} as ClusterService)
    const sessions = (service as unknown as { sessions: Map<string, unknown> }).sessions
    sessions.set('forward-1', {
      id: 'forward-1',
      kind: 'pod',
      namespace: 'default',
      name: 'api',
      localPort: 8080,
      targetPort: 8080,
      server,
      sockets,
    })

    await service.stop('forward-1')

    expect(destroy).toHaveBeenCalledOnce()
    expect(close).toHaveBeenCalledOnce()
    expect(service.list()).toEqual([])
  })
})
