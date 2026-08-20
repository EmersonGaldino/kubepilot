import { useClusterStore } from '@/stores/useClusterStore'

/** Snapshot the active kube context before an IPC round-trip so a slower
 * response from a previous cluster cannot paint over the new one. */
export function beginClusterRequest(): string | null {
  return useClusterStore.getState().currentContext
}

export function isSameClusterRequest(startedWith: string | null): boolean {
  return useClusterStore.getState().currentContext === startedWith
}
