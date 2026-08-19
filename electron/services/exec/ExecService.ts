import { randomUUID } from 'node:crypto'
import { PassThrough, Writable } from 'node:stream'

import { Exec } from '@kubernetes/client-node'

import type { ExecStartParams } from '../../../shared/types'
import type { ClusterService } from '../clusters/ClusterService'

type ExecSocket = Awaited<ReturnType<Exec['exec']>>

interface ActiveExecSession {
  stdin: PassThrough
  socket: ExecSocket
}

type ExecEvent =
  | { type: 'data'; execId: string; chunk: string }
  | { type: 'error'; execId: string; error: string }
  | { type: 'end'; execId: string }

type ExecListener = (event: ExecEvent) => void

const DEFAULT_COMMAND = ['/bin/sh']

/** Runs an interactive shell session inside a pod's container over the
 * Kubernetes exec subprotocol (a WebSocket under the hood), backing the
 * Pod drawer's "Exec" action. Mirrors {@link LogsService}'s event-emitter
 * streaming shape — the IPC layer forwards `onEvent` payloads to whichever
 * renderer window is listening, one channel per direction (data/error/end),
 * while stdin flows the other way through {@link write}.
 *
 * This is a line-based console (each `write` call is one line of typed
 * input, not raw per-keystroke input) rather than a full PTY — good enough
 * for running commands, without pulling in a terminal-emulation dependency
 * for character-by-character control-sequence handling. */
export class ExecService {
  private readonly sessions = new Map<string, ActiveExecSession>()
  private readonly listeners = new Set<ExecListener>()

  constructor(private readonly clusterService: ClusterService) {}

  onEvent(listener: ExecListener): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  private emit(event: ExecEvent): void {
    for (const listener of this.listeners) listener(event)
  }

  async start(params: ExecStartParams): Promise<string> {
    const { kubeConfig } = this.clusterService.getActiveBundle()
    const execId = randomUUID()
    const exec = new Exec(kubeConfig)
    const stdin = new PassThrough()

    const forward = new Writable({
      write: (chunk: Buffer, _encoding, callback) => {
        this.emit({ type: 'data', execId, chunk: chunk.toString('utf8') })
        callback()
      },
    })

    const command = params.command && params.command.length > 0 ? params.command : DEFAULT_COMMAND

    const socket = await exec.exec(
      params.namespace,
      params.podName,
      params.containerName ?? '',
      command,
      forward,
      forward,
      stdin,
      true,
      (status) => {
        if (status.status === 'Failure' && status.message) {
          this.emit({ type: 'error', execId, error: status.message })
        }
      },
    )

    socket.on('close', () => {
      this.emit({ type: 'end', execId })
      this.sessions.delete(execId)
    })
    socket.on('error', (error: Error) => {
      this.emit({ type: 'error', execId, error: error.message })
      this.sessions.delete(execId)
    })

    this.sessions.set(execId, { stdin, socket })
    return execId
  }

  write(execId: string, data: string): void {
    this.sessions.get(execId)?.stdin.write(data)
  }

  stop(execId: string): void {
    const session = this.sessions.get(execId)
    if (!session) return
    session.stdin.end()
    session.socket.close()
    this.sessions.delete(execId)
  }

  stopAll(): void {
    for (const execId of this.sessions.keys()) this.stop(execId)
  }
}
