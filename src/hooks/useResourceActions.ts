import { useState } from 'react'

import { kubernetesApi } from '@/services/kubernetesApi'
import type { DeletableKind, DescribableKind, RestartableKind, ScalableKind } from '@shared/types'

/** Centralizes the Describe/Delete/Scale/Restart plumbing shared by every
 * resource drawer (Pod, Deployment, StatefulSet, DaemonSet, ReplicaSet, …) —
 * a drawer just renders its buttons plus the two shared modals
 * ({@link ConfirmDialog}/{@link DescribeModal}) wired to the state and
 * callbacks this hook returns, instead of hand-rolling the same
 * loading/error bookkeeping per resource type.
 *
 * `onMutated` is called after a successful delete/scale/restart so the
 * caller can refresh its list/detail data — this hook only talks to the
 * IPC layer, it never touches any resource-specific store. */
export function useResourceActions(onMutated?: () => void) {
  const [describeOpen, setDescribeOpen] = useState(false)
  const [describeYaml, setDescribeYaml] = useState<string | null>(null)
  const [describeLoading, setDescribeLoading] = useState(false)
  const [describeError, setDescribeError] = useState<string | null>(null)

  const [confirmOpen, setConfirmOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  const [pendingDelete, setPendingDelete] = useState<{ kind: DeletableKind; namespace: string; name: string } | null>(null)

  const describe = async (kind: DescribableKind, namespace: string, name: string) => {
    setDescribeOpen(true)
    setDescribeLoading(true)
    setDescribeError(null)
    setDescribeYaml(null)
    try {
      setDescribeYaml(await kubernetesApi.describe.get({ kind, namespace, name }))
    } catch (error) {
      setDescribeError(error instanceof Error ? error.message : String(error))
    } finally {
      setDescribeLoading(false)
    }
  }

  const closeDescribe = () => setDescribeOpen(false)

  const requestDelete = (kind: DeletableKind, namespace: string, name: string) => {
    setPendingDelete({ kind, namespace, name })
    setActionError(null)
    setConfirmOpen(true)
  }

  /** Returns whether the delete actually succeeded, so callers that also
   * need to e.g. close their drawer only do so once the resource is gone —
   * state updates from the `set*` calls above aren't visible to the caller
   * until the next render, so a return value is the only reliable signal. */
  const confirmDelete = async (): Promise<boolean> => {
    if (!pendingDelete) return false
    setBusy(true)
    setActionError(null)
    try {
      await kubernetesApi.actions.delete(pendingDelete)
      setConfirmOpen(false)
      setPendingDelete(null)
      onMutated?.()
      return true
    } catch (error) {
      setActionError(error instanceof Error ? error.message : String(error))
      return false
    } finally {
      setBusy(false)
    }
  }

  const cancelDelete = () => {
    setConfirmOpen(false)
    setPendingDelete(null)
  }

  const scale = async (kind: ScalableKind, namespace: string, name: string, replicas: number) => {
    setBusy(true)
    setActionError(null)
    try {
      await kubernetesApi.actions.scale({ kind, namespace, name, replicas })
      onMutated?.()
    } catch (error) {
      setActionError(error instanceof Error ? error.message : String(error))
    } finally {
      setBusy(false)
    }
  }

  const restart = async (kind: RestartableKind, namespace: string, name: string) => {
    setBusy(true)
    setActionError(null)
    try {
      await kubernetesApi.actions.restart({ kind, namespace, name })
      onMutated?.()
    } catch (error) {
      setActionError(error instanceof Error ? error.message : String(error))
    } finally {
      setBusy(false)
    }
  }

  return {
    describe,
    describeOpen,
    describeYaml,
    describeLoading,
    describeError,
    closeDescribe,
    requestDelete,
    confirmOpen,
    confirmDelete,
    cancelDelete,
    busy,
    actionError,
    scale,
    restart,
  }
}
