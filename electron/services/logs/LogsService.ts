import { randomUUID } from 'node:crypto'
import { Writable } from 'node:stream'

import type { LogsFetchParams } from '../../../shared/types'
import type { ClusterService } from '../clusters/ClusterService'

interface ActiveStream {
  abortController: AbortController
}

type LogsEvent =
  | { type: 'data'; streamId: string; lines: string[] }
  | { type: 'error'; streamId: string; error: string }
  | { type: 'end'; streamId: string }

type LogsListener = (event: LogsEvent) => void

/** Splits a raw log buffer into lines, keeping any trailing partial line so
 * it can be prefixed onto the next chunk instead of emitted too early. */
export class LineBuffer {
  private pending = ''

  push(chunk: Buffer): string[] {
    this.pending += chunk.toString('utf8')
    const parts = this.pending.split('\n')
    this.pending = parts.pop() ?? ''
    return parts
  }

  flush(): string[] {
    const remainder = this.pending
    this.pending = ''
    return remainder.length > 0 ? [remainder] : []
  }
}

/** Reads and streams container logs for pods in whichever context
 * {@link ClusterService} currently considers active. */
export class LogsService {
  private readonly streams = new Map<string, ActiveStream>()
  private readonly listeners = new Set<LogsListener>()

  constructor(private readonly clusterService: ClusterService) {}

  onEvent(listener: LogsListener): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  private emit(event: LogsEvent): void {
    for (const listener of this.listeners) listener(event)
  }

  async fetch(params: LogsFetchParams): Promise<string[]> {
    const { log } = this.clusterService.getActiveBundle()
    const lineBuffer = new LineBuffer()
    const lines: string[] = []

    const sink = new Writable({
      write(chunk: Buffer, _encoding, callback) {
        lines.push(...lineBuffer.push(chunk))
        callback()
      },
    })

    await new Promise<void>((resolve, reject) => {
      sink.on('finish', resolve)
      sink.on('error', reject)
      log
        .log(params.namespace, params.podName, params.containerName ?? '', sink, {
          tailLines: params.tailLines ?? 200,
          timestamps: params.timestamps ?? false,
          sinceSeconds: params.sinceSeconds,
          follow: false,
        })
        .catch(reject)
    })

    lines.push(...lineBuffer.flush())
    return lines
  }

  async streamStart(params: LogsFetchParams): Promise<string> {
    const { log } = this.clusterService.getActiveBundle()
    const streamId = randomUUID()
    const lineBuffer = new LineBuffer()

    const sink = new Writable({
      write: (chunk: Buffer, _encoding, callback) => {
        const lines = lineBuffer.push(chunk)
        if (lines.length > 0) this.emit({ type: 'data', streamId, lines })
        callback()
      },
    })

    sink.on('finish', () => {
      const remainder = lineBuffer.flush()
      if (remainder.length > 0) this.emit({ type: 'data', streamId, lines: remainder })
      this.emit({ type: 'end', streamId })
      this.streams.delete(streamId)
    })

    sink.on('error', (error: NodeJS.ErrnoException) => {
      this.streams.delete(streamId)
      if (error.name === 'AbortError') {
        this.emit({ type: 'end', streamId })
        return
      }
      this.emit({ type: 'error', streamId, error: error.message })
    })

    const abortController = await log.log(params.namespace, params.podName, params.containerName ?? '', sink, {
      tailLines: params.tailLines ?? 200,
      timestamps: params.timestamps ?? false,
      sinceSeconds: params.sinceSeconds,
      follow: true,
    })

    this.streams.set(streamId, { abortController })
    return streamId
  }

  streamStop(streamId: string): void {
    this.streams.get(streamId)?.abortController.abort()
    this.streams.delete(streamId)
  }

  stopAll(): void {
    for (const streamId of this.streams.keys()) this.streamStop(streamId)
  }
}
