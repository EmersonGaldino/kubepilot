import type { IpcResult } from '../../shared/ipc-contract'

/** Wraps a service call so a thrown error never crosses the IPC boundary as
 * an uncaught rejection — the renderer always gets a typed result it can
 * render as an error state instead. */
export async function toIpcResult<T>(work: () => Promise<T>): Promise<IpcResult<T>> {
  try {
    const data = await work()
    return { ok: true, data }
  } catch (error) {
    console.error('[ipc]', error)
    return { ok: false, error: error instanceof Error ? error.message : String(error) }
  }
}

export function assertNonEmptyString(value: unknown, field: string): asserts value is string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`"${field}" must be a non-empty string`)
  }
}
