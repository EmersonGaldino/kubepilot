import { createServer, type Server, type Socket } from 'node:net'
import { randomUUID } from 'node:crypto'

import { PortForward } from '@kubernetes/client-node'

import type { PortForwardSession, PortForwardStartParams } from '../../../shared/types'
import type { ClusterService } from '../clusters/ClusterService'

interface LiveSession extends PortForwardSession {
  server: Server
}

export class PortForwardService {
  private sessions = new Map<string, LiveSession>()

  constructor(private readonly clusterService: ClusterService) {}

  async start(params: PortForwardStartParams): Promise<PortForwardSession> {
    if (!Number.isInteger(params.localPort) || params.localPort < 1 || params.localPort > 65535) {
      throw new Error('localPort must be an integer between 1 and 65535')
    }
    if (!Number.isInteger(params.targetPort) || params.targetPort < 1 || params.targetPort > 65535) {
      throw new Error('targetPort must be an integer between 1 and 65535')
    }

    const { kubeConfig } = this.clusterService.getActiveBundle()
    const forwarder = new PortForward(kubeConfig)
    const id = randomUUID()

    const server = createServer((socket: Socket) => {
      const run =
        params.kind === 'service'
          ? forwarder.portForwardService(params.namespace, params.name, [params.targetPort], socket, null, socket)
          : forwarder.portForward(params.namespace, params.name, [params.targetPort], socket, null, socket)
      void run.catch((error: unknown) => {
        socket.destroy(error instanceof Error ? error : new Error(String(error)))
      })
    })

    await new Promise<void>((resolve, reject) => {
      server.once('error', reject)
      server.listen(params.localPort, '127.0.0.1', () => {
        server.off('error', reject)
        resolve()
      })
    })

    const session: LiveSession = {
      id,
      kind: params.kind,
      namespace: params.namespace,
      name: params.name,
      localPort: params.localPort,
      targetPort: params.targetPort,
      server,
    }
    this.sessions.set(id, session)
    return {
      id,
      kind: session.kind,
      namespace: session.namespace,
      name: session.name,
      localPort: session.localPort,
      targetPort: session.targetPort,
    }
  }

  async stop(id: string): Promise<void> {
    const session = this.sessions.get(id)
    if (!session) return
    this.sessions.delete(id)
    await new Promise<void>((resolve) => session.server.close(() => resolve()))
  }

  list(): PortForwardSession[] {
    return [...this.sessions.values()].map(({ id, kind, namespace, name, localPort, targetPort }) => ({
      id,
      kind,
      namespace,
      name,
      localPort,
      targetPort,
    }))
  }

  async stopAll(): Promise<void> {
    await Promise.all([...this.sessions.keys()].map((id) => this.stop(id)))
  }
}
